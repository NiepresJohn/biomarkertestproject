"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { usePathname } from "next/navigation";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div> & { mobileBrand?: string }) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div"> & { mobileBrand?: string })} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  mobileBrand: _mobileBrand,
  ...props
}: React.ComponentProps<typeof motion.div> & { mobileBrand?: string }) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden md:flex md:flex-col bg-white border-r border-gray-200 w-[300px] shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  mobileBrand,
  ...props
}: React.ComponentProps<"div"> & { mobileBrand?: string }) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "min-h-12 px-4 py-3 flex flex-row md:hidden items-center justify-between bg-white border-b border-gray-200 w-full shrink-0"
        )}
        {...props}
      >
        <span className="text-base font-semibold text-neutral-800 truncate mr-2">
          {mobileBrand ?? "Menu"}
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-2 -m-2 rounded-lg text-neutral-800 hover:bg-gray-100 touch-manipulation"
          aria-label="Open menu"
        >
          <IconMenu2 className="h-6 w-6" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={cn(
              "fixed h-full w-full inset-0 bg-white z-[100] flex flex-col overflow-hidden md:hidden",
              className
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <span className="text-base font-semibold text-neutral-800">{mobileBrand ?? "Menu"}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 -m-2 rounded-lg text-neutral-800 hover:bg-gray-100 touch-manipulation"
                aria-label="Close menu"
              >
                <IconX className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col justify-between gap-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive =
    mounted &&
    (pathname === link.href ||
      (link.href !== "/" && pathname.startsWith(link.href)));

  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 px-3 rounded-lg transition-colors duration-150",
        isActive
          ? "bg-gray-100 text-gray-900 font-medium [&_svg]:text-gray-900"
          : "text-neutral-700 hover:bg-gray-50",
        className
      )}
      {...props}
    >
      <span className={cn("flex-shrink-0", isActive && "[&_svg]:text-gray-900")}>
        {link.icon}
      </span>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
          isActive ? "text-gray-900" : "text-neutral-700"
        )}
      >
        {link.label}
      </motion.span>
    </a>
  );
};
