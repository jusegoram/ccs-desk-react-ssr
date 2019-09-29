# People

## Agent

* account (one to one)
* firstName
* lastName

## Employee

* account (one to one)
* calls (one to many)
* plannedTimeOff (one to many)
* role ('admin', 'manager', 'supervisor', 'tech')
* employeeId
* firstName
* lastName
* phoneNumber
* employeeSets (many to many)

# Jobs

## Order

* activityNumber <-- maybe just call it `id` (maybe not - cross-company conflict?)
* location
* timezone
* appointments (one to many)
* classifiers
* status
* previousOrder

## Appointment

* timeWindow
* plannedStartTime
* actualStartTime
* actualEndTime
* expectedDuration

## OrderHistoryItem

* timestamp
* event
* data <-- jsonb

# Groups

## EmployeeSet

(encapsulates Office, HSP, Subcontractor, Tech Team, etc)

* type
* name
* employees
* geography (eventually)

## EmployeeSetMembership(?)

(history of techs in group - could even give history of job assignments, if you view "techs assigned to job" as a collection - might be able to do without for now but it might be pretty easy, too)

# Agent Utils

## Error Code <-- just hardcode it

## Call (for call log)

## ReferenceDatum <-- just hardcode it


TODO:

CONSUMER ELECTRONICS


UPSELL - selling other products while we are in their home.

Tech Dash
