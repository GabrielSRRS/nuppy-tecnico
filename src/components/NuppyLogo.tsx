import logo from "@/assets/nuppy-logo.png";

export function NuppyLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Nuppy"
      className={"select-none pointer-events-none " + className}
      draggable={false}
    />
  );
}
