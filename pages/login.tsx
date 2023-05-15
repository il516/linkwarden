// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

interface FormData {
  email: string;
  password: string;
}

export default function () {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
  });

  async function loginUser() {
    console.log(form);
    if (form.email != "" && form.password != "") {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      console.log(res);

      if (!res?.ok) {
        console.log("User not found or password does not match.", res);
      }
    } else {
      console.log("Please fill out all the fields.");
    }
  }

  return (
    <div className="p-5">
      <p className="text-3xl font-bold text-center mb-10">Linkwarden</p>
      <input
        type="text"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border border-gray-700 rounded-md block m-2 mx-auto p-2"
      />
      <input
        type="text"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border border-gray-700 rounded-md block m-2 mx-auto p-2"
      />
      <div
        className="mx-auto bg-black w-min p-3 m-5 text-white rounded-md cursor-pointer"
        onClick={loginUser}
      >
        Login
      </div>
      <Link href={"/register"} className="block mx-auto w-min">
        Register
      </Link>
    </div>
  );
}