import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <>
      <header className="flex justify-center items-center py-4 h-8 sticky top-2 bg-[#09090B]">
        <div className="flex justify-start items-center w-[70%]">
          <div className="w-full p-0 flex justify-start items-center">
            <nav className="flex justify-start pl-4 items-center w-full">
              <NavMenu />
            </nav>
          </div>
        </div>
        <div className="flex flex-row-reverse items-center w-[30%]">
          <div className="hover:cursor-pointer rounded-3xl w-[40px] h-[40px] mx-2 bg-white text-black flex justify-center items-center">
            pfp
            {/*Do zmiany na ikonke*/}
          </div>{" "}
          <SearchBar />
        </div>
      </header>
      <hr className=" border-[#27272A]" />
    </>
  );
}

function NavMenu() {
  return (
    <ul className="flex justify-around items-center space-x-5 text-gray-400">
      <li>
        <Link href="#" className="hover:text-white">
          Overview
        </Link>
      </li>
      <li>
        <Link href="#" className="hover:text-white">
          Events
        </Link>
      </li>
      <li>
        <Link href="#" className="hover:text-white">
          Chores
        </Link>
      </li>
      <li>
        <Link href="#" className="hover:text-white">
          Bills
        </Link>
      </li>
      <li>
        <Link href="#" className="hover:text-white">
          Shopping list
        </Link>
      </li>
      <li>
        <Link href="#" className="hover:text-white">
          Messages
        </Link>
      </li>
      <li>
        <Link href="#" className="hover:text-white">
          Managment
        </Link>
      </li>
    </ul>
  );
}

function SearchBar() {
  return (
    <input
      type="text"
      placeholder="Search..."
      className="w-1/2 h-8 p-2 mx-3 bg-[#09090B] rounded-[6px] border border-[#27272A] text-sm text-gray-300 placeholder:text-[#A1A1AA]"
    />
  );
}
