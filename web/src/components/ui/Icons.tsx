import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function IconBase({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconBag(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 7V6a5 5 0 0 1 10 0v1" />
      <path d="M6 7h12l-1 14H7L6 7Z" />
    </IconBase>
  );
}

export function IconUser(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
    </IconBase>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s-7-4.5-9.2-8.4C1.2 9.7 2.7 6.8 5.8 6.1c1.6-.4 3.3.2 4.4 1.6 1.1-1.4 2.8-2 4.4-1.6 3.1.7 4.6 3.6 3 6.5C19 16.5 12 21 12 21Z" />
    </IconBase>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3h10v18l-2-1-3 1-3-1-2 1V3Z" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h5" />
    </IconBase>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z" />
      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M17.5 6.5h.01" />
    </IconBase>
  );
}

export function IconFacebook(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v3H7v3h3v5h3v-5h3l1-3h-4v-3c0-.6.4-1 1-1Z" />
    </IconBase>
  );
}

export function IconWhatsapp(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 11.5a8 8 0 0 1-12.1 7l-3.9 1 1.1-3.7A8 8 0 1 1 20 11.5Z" />
      <path d="M9.6 9.3c.2-.5.4-.5.7-.5h.6c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4 0 .6l-.4.5c-.1.1-.1.3 0 .4.4.7 1.1 1.4 1.9 1.8.1.1.3.1.4 0l.6-.4c.2-.1.4-.1.6 0l1.7.8c.2.1.4.3.4.5v.6c0 .3-.1.5-.5.7-.6.3-1.5.4-2.7-.1-1.9-.8-3.6-2.4-4.5-4.3-.6-1.2-.5-2.1-.1-2.7Z" />
    </IconBase>
  );
}

export function IconSnapchat(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3c2.3 0 4 1.9 4 4.2v2c0 1.2.6 1.6 1.4 2 .6.3 1.5.6 1.6 1.2.1.7-.9 1-1.5 1.2-.6.2-1 .5-1 1 0 1-1.3 1.2-2.3 1.2-.4 0-.8.2-1.2.5-.4-.3-.8-.5-1.2-.5-1 0-2.3-.2-2.3-1.2 0-.5-.4-.8-1-1-.6-.2-1.6-.5-1.5-1.2.1-.6 1-.9 1.6-1.2.8-.4 1.4-.8 1.4-2v-2C8 4.9 9.7 3 12 3Z" />
    </IconBase>
  );
}

export function IconTikTok(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 3v10.5a3.5 3.5 0 1 1-3-3.4" />
      <path d="M14 6c1.2 2.3 2.9 3.6 5 3.9V6.8c-1.6-.2-3.1-1.4-4-3.8H14Z" />
    </IconBase>
  );
}

export function IconEye(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </IconBase>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2.5 2.5 0 0 0 12 15a3 3 0 0 0 3-3c0-.5-.1-1-.3-1.4" />
      <path d="M6.7 6.7C4.2 8.3 2.6 12 2.6 12S5.8 19 12 19c1.9 0 3.5-.4 4.9-1.1" />
      <path d="M12 5c6.2 0 9.4 7 9.4 7s-.8 1.9-2.4 3.6" />
    </IconBase>
  );
}
