import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-subtle">
      <div className="animate-flip-vertical">
        <Image
          src="/logo.png"
          alt="Chargement..."
          width={80}
          height={80}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
