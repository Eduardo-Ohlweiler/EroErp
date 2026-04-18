import { useEffect, useState } from "react"

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") ?? "light"
  )

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.getItem("theme")
    localStorage.setItem("theme", theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => prev === "light" ? "dark" : "light")
  }

  return { theme, toggleTheme }
}