'use client';
import { useState, type FormEvent } from "react";
import { ApiError, saveSession } from "@/lib/api";
import { authApi } from "@/lib/services";
import Header from "../component/Header";
 type FormErrors = {
   firstName?: string;
   lastName?: string;
   email?: string;
   password?: string;
   companyName?: string;
   companyLogo?: string;
   address?: string;
   city?: string;
   zipCode?: string;
   industry?: string;
   currency?: string;
   general?: string;
 };

const API_FIELD_MAP: Record<string, keyof FormErrors> = {
  firstname: "firstName",
  lastname: "lastName",
  email: "email",
  password: "password",
  companyname: "companyName",
  address: "address",
  city: "city",
  zip: "zipCode",
  industry: "industry",
  currencysymbol: "currency",
  logo: "companyLogo",
};

export default function Signup() {
const [errors, setErrors] = useState<FormErrors>({});
const [loading, setLoading] = useState(false);
const [logoName, setLogoName] = useState("");
const [logoPreview, setLogoPreview] = useState("");
 
  // =============== Validate Fields (PRD Signup field rules) =====================
  const validateForm = (formData: FormData):FormErrors => {
    const nextErrors: FormErrors = {}
    const firstName = String(formData.get("firstName") ?? "").trim()
    const lastName = String(formData.get("lastName") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const companyName = String(formData.get("companyName") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim()
    const industry = String(formData.get("industry") ?? "").trim()
    const currency = String(formData.get("currency") ?? "").trim()
    const companyLogo = formData.get("companyLogo")
       if (!firstName) {
         nextErrors.firstName = "Please enter your first name.";
       } else if (firstName.length > 50) {
         nextErrors.firstName = "First name can be at most 50 characters.";
       }
       if (!lastName) {
         nextErrors.lastName = "Please enter your last name.";
       } else if (lastName.length > 50) {
         nextErrors.lastName = "Last name can be at most 50 characters.";
       }
       if (!email || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
         nextErrors.email = "Enter a valid email address.";
       }
       if (!password || password.length < 8) {
         nextErrors.password = "Password must be at least 8 characters long.";
       } else if (password.length > 20) {
         nextErrors.password = "Password can be at most 20 characters.";
       } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
         nextErrors.password = "Password must include letters and numbers.";
       }
       if (!companyName) {
         nextErrors.companyName = "Please enter your company name.";
       } else if (companyName.length > 100) {
         nextErrors.companyName = "Company name can be at most 100 characters.";
       }
       if (!address) {
         nextErrors.address = "Please enter company address.";
       } else if (address.length > 500) {
         nextErrors.address = "Address can be at most 500 characters.";
       }
       if (!city) {
         nextErrors.city = "Please enter city.";
       } else if (city.length > 50) {
         nextErrors.city = "City can be at most 50 characters.";
       }
       if (industry.length > 50) {
         nextErrors.industry = "Industry can be at most 50 characters.";
       }
       if (!currency || currency.length > 5) {
         nextErrors.currency = "Enter a valid currency symbol.";
       }
       if (companyLogo instanceof File && companyLogo.size > 0) {
         if (!["image/png", "image/jpeg"].includes(companyLogo.type)) {
           nextErrors.companyLogo = "Invalid logo file. Use PNG or JPG.";
         } else if (companyLogo.size > 5 * 1024 * 1024) {
           nextErrors.companyLogo = "Invalid logo file. Max size is 5 MB.";
         }
       }

       return nextErrors;
  }

  const clearError = (field : keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }

  // ============Handle Submit function ============
  const handleSubmit = async (e:FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (loading) return;
  const form = e.currentTarget;
  const formData = new FormData(form);

  const validationErrors = validateForm(formData);
  setErrors(validationErrors);
  if (Object.keys(validationErrors).length > 0) {return}
  setLoading(true);

  try {
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const signUpData = new FormData();
    signUpData.append("firstName", text("firstName"));
    signUpData.append("lastName", text("lastName"));
    signUpData.append("email", text("email"));
    signUpData.append("password", String(formData.get("password") ?? ""));
    signUpData.append("companyName", text("companyName"));
    signUpData.append("address", text("address"));
    signUpData.append("city", text("city"));
    signUpData.append("zip", text("zipCode"));
    signUpData.append("industry", text("industry"));
    signUpData.append("currencySymbol", text("currency"));

    const logo = formData.get("companyLogo");
    if (logo instanceof File && logo.size > 0) {signUpData.append("logo", logo);}

    const result = await authApi.signup(signUpData);
    if (!result?.token) {
      throw new Error("Signup succeeded but no token was returned. Please log in.");
    }

    saveSession(result, false);
    window.location.href = "/invoices";
  }
  catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        setErrors({ email: "Email already exists." });
        return;
      }
      if (error.status === 413 || error.status === 415) {
        setErrors({ companyLogo: error.message });
        return;
      }
      if (error.fieldErrors) {
        const mapped: FormErrors = {};
        for (const [key, value] of Object.entries(error.fieldErrors)) {
          const field = API_FIELD_MAP[key.toLowerCase()];
          if (field) mapped[field] = value;
        }
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
          return;
        }
      }
      if (/password/i.test(error.message)) {
        setErrors({ password: error.message });
        return;
      }
    }
    setErrors({
      general:
        error instanceof Error && error.message
          ? error.message
          : "Could not sign up. Try again.",
    });
  }
  finally {
      setLoading(false);
  }
  };
  const ErrorText = ({ message }: { message?: string }) =>
    message ? (
      <p className="mt-1 text-xs text-red-500 whitespace-pre-line" role="alert">
        {message}
      </p>
    ) : null;
  return (
    <>
       <Header></Header>
      <div className="text-center m-5">
        <h1 className="title">Create Your Account</h1>
        <p className="subtitle">
          Set up your company and start invoicing in minutes.
        </p>
      </div>
      <div className="container w-full max-w-[900px] mx-auto mb-5">
         <form onSubmit={handleSubmit} noValidate>
          <div className="d_grid border-b border-[var(--border-light)]">
            {/* User Information */}
            <section>
              <h2 className="section_title">User Information</h2>

              <div className="mb_15">
                <label className="form_label" htmlFor="firstName">
                  First Name*
                </label>
                <input
                  className="form_input"
                  id="firstName"
                  name="firstName"
                  type="text"
                  maxLength={50}
                  placeholder="Enter first name"
                  onChange={() => clearError("firstName")}
                  aria-invalid={!!errors.firstName}
                />
                <ErrorText message={errors.firstName} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="lastName">
                  Last Name*
                </label>
                <input
                  className="form_input"
                  id="lastName"
                  name="lastName"
                  type="text"
                  maxLength={50}
                  placeholder="Enter last name"
                  onChange={() => clearError("lastName")}
                  aria-invalid={!!errors.lastName}
                />
                <ErrorText message={errors.lastName} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="email">
                  Email*
                </label>
                <input
                  className={`form_input ${errors.email ? "border-red-500" : ""}`}
                  id="email"
                  name="email"
                  type="email"
                  maxLength={100}
                  placeholder="Enter your email"
                  onChange={() => clearError("email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <ErrorText message={errors.email} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="password">
                  Password*
                </label>
                <input
                  className="form_input"
                  id="password"
                  name="password"
                  type="password"
                  maxLength={20}
                  placeholder="Enter password"
                  onChange={() => clearError("password")}
                  aria-invalid={!!errors.password}
                />
                <ErrorText message={errors.password} />
                <p className="password-strength-text">
                  Password must be at least 8 characters.
                </p>
              </div>
            </section>

            {/* Company Information */}
            <section>
              <h2 className="section_title">Company Information</h2>

              <div className="mb_15">
                <label className="form_label" htmlFor="companyName">
                  Company Name*
                </label>
                <input
                  className="form_input"
                  id="companyName"
                  name="companyName"
                  type="text"
                  maxLength={100}
                  placeholder="Enter company name"
                  onChange={() => clearError("companyName")}
                  aria-invalid={!!errors.companyName}
                />
                <ErrorText message={errors.companyName} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="companyLogo">
                  Company Logo
                </label>
                <input
                  className="form_input file-input"
                  id="companyLogo"
                  name="companyLogo"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    clearError("companyLogo");
                    const file = e.currentTarget.files?.[0];
                    setLogoName(file?.name ?? "");
                    if (logoPreview) URL.revokeObjectURL(logoPreview);
                    setLogoPreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                {logoName && (
                  <p className="mt-1 text-xs text-gray-600">{logoName}</p>
                )}
                {logoPreview && (
                  <img src={logoPreview} alt="Logo preview" className="mt-1 h-12 w-12 rounded object-cover" />
                )}
                <p className="mt-2 text-[10px] text-muted">
                  Maximum file size: 5 MB
                </p>
                <ErrorText message={errors.companyLogo} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="address">
                  Address*
                </label>
                <textarea
                  className="form_input address-input"
                  id="address"
                  name="address"
                  maxLength={500}
                  placeholder="Enter company address"
                  onChange={() => clearError("address")}
                  aria-invalid={!!errors.address}
                />
                <ErrorText message={errors.address} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="city">
                  City*
                </label>
                <input
                  className="form_input"
                  id="city"
                  name="city"
                  type="text"
                  maxLength={50}
                  placeholder="Enter city"
                  onChange={() => clearError("city")}
                  aria-invalid={!!errors.city}
                />
                <ErrorText message={errors.city} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="zipCode">
                  Zip Code*
                </label>
                <input
                  className="form_input"
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 digit zip code"
                  onChange={() => clearError("zipCode")}
                  aria-invalid={!!errors.zipCode}
                />
                <ErrorText message={errors.zipCode} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="industry">
                  Industry
                </label>
                <input
                  className="form_input"
                  id="industry"
                  name="industry"
                  type="text"
                  maxLength={50}
                  placeholder="Industry type"
                  onChange={() => clearError("industry")}
                />
                <ErrorText message={errors.industry} />
              </div>

              <div className="mb_15">
                <label className="form_label" htmlFor="currency">
                  Currency Symbol*
                </label>
                <input
                  className="form_input"
                  id="currency"
                  name="currency"
                  type="text"
                  maxLength={5}
                  placeholder="$, ₹, €, AED"
                  onChange={() => clearError("currency")}
                  aria-invalid={!!errors.currency}
                />
                <ErrorText message={errors.currency} />
              </div>
            </section>
          </div>

          {errors.general && (
            <p className="mt-3 text-sm text-red-500 whitespace-pre-line" role="alert">
              {errors.general}
            </p>
          )}

          <div className="my-2 text-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn_bg_primary d-block ms-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <p className="text-center text-[12px] text-muted">
              Already have an account? <a href="/login">Login</a>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}
