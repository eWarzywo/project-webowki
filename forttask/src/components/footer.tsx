import Image from "next/image";

export default function Footer() {
  return (
    <>
      <footer className="flex justify-center items-center w-full pt-6 pb-8 px-8 sticky bottom-0 ml-6">
        <div className="flex justify-center items-center w-full">
          <p className="text-white text-center opacity-40">
            © 2025 FortTask. All rights reserved.
          </p>
        </div>
        <div className="sticky left-0 bottom-0 bg-[#FAFAFA] rounded-xl p-3 mt-3">
          <Image
            src="/Messages.svg"
            alt="FortTask logo"
            width={32}
            height={20}
          />
        </div>
      </footer>
    </>
  );
}
