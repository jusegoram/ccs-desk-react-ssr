export function up(knex) {
  return knex.schema.createTable('Invite', table => {
    table
    .uuid('id')
    .primary()
    .defaultTo(knex.raw('uuid_generate_v4()'))
    table.string('role').notNullable()
    table
    .string('status')
    .notNullable()
    .defaultTo('Unsent')
    table.uuid('token').defaultTo(knex.raw('uuid_generate_v4()'))
    table
    .uuid('senderId')
    .notNullable()
    .index()
    table
    .uuid('recipientId')
    .notNullable()
    .index()
    table
    .timestamp('createdAt')
    .defaultTo(knex.fn.now())
    .notNullable()
    table.foreign('senderId').references('Account.id')
    table.foreign('recipientId').references('Account.id')
  })
}

export function down(knex) {
  return knex.schema.dropTable('Invite')
}
