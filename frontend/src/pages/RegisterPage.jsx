import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await register(formData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Start tracking your job applications in one workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} />
          <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
          <Input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} />

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <Button type="submit" className="w-full">Register</Button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-medium text-sky-600 hover:text-sky-700">Login</Link>
        </p>
      </Card>
    </div>
  );
}
