export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full flex flex-row gap-2 justify-between py-8 bg-slate-950/80 backdrop-blur-sm font-mono text-md tracking-widest ">
      <span className="uppercase text-teal-400">
        MDHDS Capstone Demo
      </span>
      <div className="flex flex-row justify-end gap-4 [&>a]:hover:text-teal-400 [&>a]:hover:underline [&>a]:transition">
        <a href="/">Demo</a>
        <a href="/context">Context</a>
        <a href="/methodology">Methodology</a>
      </div>
    </header>
  )
};