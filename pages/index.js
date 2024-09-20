import * as React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";

import { useSession, signIn, signOut } from "next-auth/react";
export default function Home() {
  const { data: session, status } = useSession();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isRegistered, setIsRegistered] = useState(true);
  const router = useRouter();
  const Authentication = async (formData) => {
    try {
      const { data } = await axios.post(
        process.env.NEXT_PUBLIC_SOCKET_URL + "/vChat/auth",
        formData
      );
      if (data.status == "ok") {
        Cookies.set("Vchat-userData", JSON.stringify(data.data));
        router.push(`/meetinghome?userID=${data.data._id}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log("ERR:", error);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    signUp();
  };

  if (session) {
    Authentication(session.user);
  }
  useEffect(() => {
    const userData = Cookies.get("Vchat-userData");
    if (userData) {
      router.push(`/meetinghome`);
    }
  }, []);

  return (
    <div className="border-2 border-[#808080] shadow-custom-grey  max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8  bg-white dark:bg-[#3a3a3a] absolute bottom-0 m-auto h-max right-0 left-0 top-0">
      <form className="my-8" onSubmit={handleSubmit}>
        <div className=" mb-4">
          <div className="mb-4">
            <label htmlFor="username" className="mb-2 block">
              User name
            </label>
            <div className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]">
              <input
                id="username"
                type="text"
                className="w-full h-1/10 pb-2 pt-2 pl-2 pr-2 focus:border-hidden outline-none"
                placeholder="Email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
              <BottomGradient />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="firstname mb-2" className="mb-2 block">
              Password{" "}
            </label>
            <div className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]">
              <input
                id="firstname"
                type="password"
                className="w-full h-1/10 pb-2 pt-2 pl-2 pr-2 focus:border-hidden outline-none"
                placeholder="Password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <BottomGradient />
            </div>
          </div>
        </div>

        <button
          className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
          type="submit"
        >
          Sign in &rarr;
          <BottomGradient />
        </button>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />
        <div className="flex flex-col space-y-4">
          <button
            className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
            type="submit"
          >
            <FaGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">
              GitHub
            </span>
            <BottomGradient />
          </button>
          <button
            type="submit"
            className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
            onClick={() => signIn("google")}
          >
            <FcGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">
              Google
            </span>
            <BottomGradient />
          </button>
        </div>
      </form>
      <h4 className="text-right text-md mt-10 mb-0">
        Don't have account{" "}
        <button
          className="text-purple font-semibold"
          onClick={() => setIsRegistered(false)}
        >
          sign up
        </button>
      </h4>
    </div>
  );
}
const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};
