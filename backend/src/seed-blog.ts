import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { BlogPost } from './blog/entities/blog-post.entity'
import { Project } from './projects/entities/project.entity'
import { ProjectMedia } from './projects/entities/project-media.entity'
import { BLOG_SEED_POSTS } from './blog-seed-posts'

config()

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'renel_enerji',
  // BlogPost.collection -> Project ilişkisi hedef entity'ler olmadan metadata kuramaz
  entities: [BlogPost, Project, ProjectMedia],
})

// Idempotent: a post is matched on its slug, so re-running updates the copy in
// place instead of creating duplicates. Existing posts written in the admin are
// never touched — only the slugs listed in BLOG_SEED_POSTS.
async function run(): Promise<void> {
  await ds.initialize()
  const repo = ds.getRepository(BlogPost)

  let created = 0
  let updated = 0

  // Newest first in the list, so sortOrder ascends while publishedAt descends.
  for (const [index, post] of BLOG_SEED_POSTS.entries()) {
    const existing = await repo.findOne({ where: { slug: post.slug } })
    const row = {
      ...post,
      sortOrder: index,
      published: true,
      publishedAt: new Date(post.publishedAt),
    }

    if (existing) {
      await repo.update(existing.id, row)
      updated++
    } else {
      await repo.save(repo.create(row))
      created++
    }
  }

  console.log(`Blog seed done — ${created} created, ${updated} updated (${BLOG_SEED_POSTS.length} total).`)
  await ds.destroy()
}

run().catch((err) => {
  console.error('Blog seed failed:', err)
  process.exit(1)
})
