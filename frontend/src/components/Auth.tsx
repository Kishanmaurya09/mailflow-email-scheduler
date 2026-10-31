import { useState } from "react";

type AuthProps = {
  onLogin: (token: string, user: { name: string; email: string }) => void;
};

function Auth({ onLogin }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:3000/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(isRegister ? { name } : {}),
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      if (isRegister) {
        setIsRegister(false);
        setMessage("Registration successful! Please log in.");
        setPassword("");
      } else {
  onLogin(data.token, data.user);
}
    } catch {
      setMessage("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
      >
        <h1 className="text-2xl font-bold">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h1>

        {isRegister && (
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
          />
        )}

        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
        />

        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (minimum 8 characters)"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
        />

        {message && (
          <p role="status" className="text-sm text-amber-400">
            {message}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 p-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : isRegister
              ? "Create Account"
              : "Login"}
        </button>

        <p className="text-center text-sm text-slate-400">
          {isRegister ? "Already registered?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
            }}
            className="text-indigo-400 hover:text-indigo-300"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </form>
    </div>
  );
}

export default Auth;