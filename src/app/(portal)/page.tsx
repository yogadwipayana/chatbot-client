import type { Metadata } from "next"

import { CourseTable } from "@/components/dashboard/course-table"
import { StudentSummary } from "@/components/dashboard/student-summary"
import { courses, student } from "@/lib/portal-data"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function DashboardPage() {
  return (
    <>
      <StudentSummary student={student} />
      <CourseTable courses={courses} />
    </>
  )
}
