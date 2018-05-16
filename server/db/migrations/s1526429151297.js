export function up(knex) {
  return knex.schema
  .alterTable('Appointment', table => {
    table.dropColumn('workOrderId')
  })
  .alterTable('Appointment', table => {
    table
    .uuid('workOrderId')
    .defaultTo(knex.raw('uuid_generate_v4()'))
    .index()
  })
  .dropTable('WorkOrder').raw(`
    create or replace view "WorkOrder" as (
      with t as (
        select *, ROW_NUMBER() over (partition by "workOrderId" order by "createdAt" desc) as rk 
        from "Appointment"
      )
      select
        "workOrderId" as id,
        id as "currentAppointmentId",
        "dueDate",
        type,
        status,
        "techId"
      from t 
      where t.rk = 1
    )
    
  `)
}

export function down(knex, Promise) {
  return Promise.resolve()
}
