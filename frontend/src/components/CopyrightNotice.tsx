export function CopyrightNotice({ className = '' }: { className?: string }) {
  return (
    <p className={className}>
      Copyright &copy; {new Date().getFullYear()} Chester Sigua.
    </p>
  );
}
