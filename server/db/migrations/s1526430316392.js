export function up(knex) {
  return knex.schema.raw(`
    create or replace view "WorkOrder" as (
      with t as (
        select *, ROW_NUMBER() over (partition by "workOrderId" order by "createdAt" desc) as rk 
        from "Appointment"
      )
      select
        "workOrderId" as id,
        id as "currentAppointmentId",
        "externalId",
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
