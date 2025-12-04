import { ThemeToggle } from "@/components/theme-toggle"


export function SiteHeader() {
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <img src="/icon/48.png" alt="Extension icon" className="h-10 w-10" />
        <span className="text-2xl font-semibold ml-1">browsertrigger</span>

        <ThemeToggle className="ml-auto" />
      </div>
    </header>
  )
}
