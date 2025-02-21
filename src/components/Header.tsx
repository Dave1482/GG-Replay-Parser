import { AuthButton } from "./AuthButton";

export const Header = () => {
  return (
    <header className="flex items-center justify-between bg-gray-100 p-4 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">GG Replay Parser</h1>
      <AuthButton />
    </header>
  );
};
