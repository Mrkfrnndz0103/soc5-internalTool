"use client"

export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">{title}</h1>
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          {description || "This page is under development. Content will be added soon."}
        </p>
      </div>
    </div>
  )
}
