# SmartShift Phase 1 Project Documentation

## 1. Author Information

- Name: Nemuel Nuhyel Laushi
- Neptun Code: L0A3O
- Date: May 2026

## 2. Project Overview

### 2.1 Topic

SmartShift is a full-stack web application for managing warehouse employee shifts, shift tasks, and task assignments. The system helps administrators organize workers into shifts, assign tasks, and monitor workload, while workers can view their own schedule, assigned tasks, and request shift swaps.

### 2.2 Problem Statement

Warehouse operations depend on accurate staffing, timely task allocation, and clear visibility into daily work. Manual coordination with paper schedules, spreadsheets, or chat messages leads to avoidable conflicts such as understaffed shifts, overlapping assignments, unclear task ownership, and slow response to absence or change requests.

SmartShift addresses this problem by centralizing shift planning and task coordination in a single web application with role-based access for warehouse administrators and workers.

### 2.3 Project Goal

The goal of SmartShift is to provide a practical warehouse workforce management system that:

- helps administrators create and manage shifts
- assigns workers to shifts based on capacity and availability
- creates and tracks operational tasks for each shift
- allows workers to see their schedules and task responsibilities
- supports a controlled shift swap process

## 3. Target Users

### 3.1 Administrator

The administrator manages warehouse operations. This user can:

- create, update, and delete shifts
- assign workers to shifts
- create and manage tasks
- assign tasks to workers
- monitor workload and staffing levels
- review and approve shift swap requests
- manage user accounts

### 3.2 Worker

The worker uses the system to follow assigned work. This user can:

- view personal shift assignments
- view assigned tasks
- update task progress where permitted
- request a shift swap when necessary
- respond to incoming swap requests

## 4. Scope of Phase 1

Phase 1 focuses on the core workflows needed for warehouse shift and task management.

### 4.1 Included Features

- user registration and login
- role-based access control
- shift management
- shift assignment management
- task management
- task assignment management
- worker schedule view
- dashboard metrics and overview
- shift swap request workflow
- drag-and-drop planner for assigning workers to shifts

### 4.2 Out of Scope for Phase 1

- payroll integration
- attendance hardware integration
- SMS or email notification automation
- reporting dashboards beyond core operational summaries
- mobile native applications

## 5. Functional Requirements

### 5.1 Authentication and Access Control

The system shall:

- allow users to register and log in
- distinguish between administrator and worker roles
- restrict administrative functions to administrators
- limit workers to their own schedules, tasks, and swap actions

### 5.2 Shift Management

The system shall:

- allow administrators to create shifts with title, date, start time, end time, capacity, location, and notes
- allow administrators to update or delete shifts
- prevent invalid shift assignment conditions such as exceeding capacity or assigning overlapping shifts

### 5.3 Task Management

The system shall:

- allow administrators to create tasks linked to a shift
- store task title, description, priority, and status
- allow tasks to be updated as warehouse work progresses

### 5.4 Assignment Management

The system shall:

- allow administrators to assign workers to shifts
- allow administrators to assign workers to tasks
- ensure task assignments are linked to valid workers
- maintain assignment status values for workflow tracking

### 5.5 Shift Swap Workflow

The system shall:

- allow a worker to request a swap for one of their assigned shifts
- allow another worker to accept or reject the request
- allow an administrator to approve or reject the final swap

## 6. Non-Functional Requirements

- The system should provide a responsive web interface for desktop and laptop use.
- The application should use a relational database structure for data consistency.
- The interface should remain simple enough for daily operational use by non-technical staff.
- The backend should expose a structured API for frontend communication.
- The system should maintain clear separation between business logic, persistence, and presentation layers.

## 7. System Architecture

SmartShift follows a full-stack client-server architecture.

### 7.1 Backend

- Laravel 13
- PHP 8.3
- Laravel Sanctum for API authentication
- REST-style API endpoints
- Eloquent ORM for relational data access

### 7.2 Frontend

- React 19 single-page application
- React Router for page navigation
- TanStack Query for server-state handling
- Vite for frontend tooling
- Tailwind CSS 4 for styling

### 7.3 Database

- SQLite in the current project setup
- relational schema based on users, shifts, tasks, assignments, and swap requests

## 8. Core Data Model

### 8.1 User

A system user who can log in and use the platform.

Main attributes:

- `id`
- `name`
- `email`
- `password`
- `role`

### 8.2 Shift

A warehouse work period created by an administrator.

Main attributes:

- `id`
- `created_by`
- `title`
- `shift_date`
- `start_time`
- `end_time`
- `capacity`
- `location`
- `notes`

### 8.3 ShiftAssignment

A record connecting a worker to a shift.

Main attributes:

- `id`
- `shift_id`
- `user_id`
- `status`
- `sort_order`

### 8.4 Task

A work item attached to a specific shift.

Main attributes:

- `id`
- `shift_id`
- `title`
- `description`
- `priority`
- `status`

### 8.5 TaskAssignment

A record connecting a task to a worker.

Main attributes:

- `id`
- `task_id`
- `user_id`
- `status`

### 8.6 ShiftSwapRequest

A request initiated by a worker to exchange a shift assignment with another worker.

Main attributes:

- `id`
- `requester_id`
- `source_assignment_id`
- `target_assignment_id`
- `status`
- `reason`

## 9. Entity Relationships

- One `User` can create many `Shift` records.
- One `Shift` can have many `ShiftAssignment` records.
- One `Shift` can have many `Task` records.
- One `Task` can have many `TaskAssignment` records.
- One `User` can appear in many `ShiftAssignment` records.
- One `User` can appear in many `TaskAssignment` records.
- One `User` can create many `ShiftSwapRequest` records.
- One `ShiftSwapRequest` references a source shift assignment and optionally a target shift assignment.

## 10. Main Pages and Modules

The Phase 1 frontend is organized around the following pages:

- `Dashboard`: overview of staffing, tasks, and operational state
- `Shifts`: create and manage warehouse shifts
- `Planner`: drag-and-drop assignment of workers into shifts
- `Tasks`: create and manage shift-related tasks
- `My Schedule`: worker view of upcoming shifts
- `Swap Requests`: creation and handling of shift swap workflows
- `Users`: administrator management of user accounts
- `Login` and `Register`: authentication entry points

## 11. Expected Benefits

SmartShift is intended to improve warehouse coordination by:

- reducing scheduling conflicts
- improving visibility into staffing and task allocation
- giving workers a clear view of expected work
- reducing manual communication around shift changes
- supporting more consistent operational planning

## 12. Conclusion

SmartShift is a warehouse shift and task management system designed to digitize core workforce coordination processes. Phase 1 establishes the application foundation through authentication, role-based access, shift planning, task assignment, and shift swap handling. This scope provides a solid basis for later extensions such as notifications, analytics, and deeper operational integrations.
