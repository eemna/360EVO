import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

vi.mock("../services/axios.ts", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockShowToast = vi.fn();
vi.mock("../context/ToastContext.tsx", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockLogin = vi.fn();
vi.mock("../hooks/useAuth.ts", () => ({
  useAuth: () => ({ login: mockLogin, user: null }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import LoginPage from "../app/pages/Login";
import RegistrationPage from "../app/pages/Register";
import ResetPasswordPage from "../app/pages/ResetPasswordPage";
import VerifyEmailPage from "../app/pages/VerifyEmailPage";
import { PasswordStrengthBar } from "../app/components/ui/password-strength-bar";
import api from "../services/axios";

function renderWithRouter(ui: React.ReactElement, search = "") {
  return render(
    <MemoryRouter initialEntries={[`/${search}`]}>{ui}</MemoryRouter>,
  );
}
describe("PasswordStrengthBar", () => {
  test("renders nothing when password is empty", () => {
    const { container } = render(<PasswordStrengthBar password="" />);
    expect(container.firstChild).toBeNull();
  });

  test("shows Weak for short password (≤2 score)", () => {
    render(<PasswordStrengthBar password="abc" />);
    expect(screen.getByText(/password strength: weak/i)).toBeInTheDocument();
  });

  test("shows Medium for moderate password", () => {
    render(<PasswordStrengthBar password="Abcdef1" />);
    expect(screen.getByText(/password strength: medium/i)).toBeInTheDocument();
  });

  test("shows Strong for strong password", () => {
    render(<PasswordStrengthBar password="StrongPass1!" />);
    expect(screen.getByText(/password strength: strong/i)).toBeInTheDocument();
  });

  test("password with only lowercase → Weak", () => {
    render(<PasswordStrengthBar password="abc" />);
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  test("password with uppercase + lowercase + number → at least Medium", () => {
    render(<PasswordStrengthBar password="TestPass1" />);
    expect(
      screen.getByText(/password strength: (medium|strong)/i),
    ).toBeInTheDocument();
  });

  test("renders 3 bar segments when password is provided", () => {
    const { container } = render(<PasswordStrengthBar password="Test1!" />);
    const bars = container.querySelectorAll(".h-1\\.5");
    expect(bars.length).toBe(3);
  });
});

describe("LoginPage", () => {
  beforeEach(() => vi.clearAllMocks());

  test("renders email and password inputs", () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  test("renders Sign In submit button", () => {
    renderWithRouter(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /^sign in$/i }),
    ).toBeInTheDocument();
  });

  test("renders Forgot Password? button", () => {
    renderWithRouter(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /forgot password\?/i }),
    ).toBeInTheDocument();
  });

  test("renders Sign up button", () => {
    renderWithRouter(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /^sign up$/i }),
    ).toBeInTheDocument();
  });

  test("renders welcome heading", () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText(/welcome back to 360evo/i)).toBeInTheDocument();
  });

  test("shows 'Signing in...' and disables button while submitting", async () => {
    vi.mocked(api.post).mockReturnValue(new Promise(() => {}));

    renderWithRouter(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /signing in/i }),
      ).toBeDisabled();
    });
  });

  test("on success: calls login(), shows toast, navigates to /app", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "test@test.com",
          role: "MEMBER",
          name: "Test",
        },
        accessToken: "tok_abc123",
      },
    });

    renderWithRouter(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "TestPass1");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: "test@test.com" }),
        "tok_abc123",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/app");
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      );
    });
  });

  test("on 401: shows Invalid Credentials toast, does NOT navigate to /app", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { status: 401, data: { message: "Invalid credentials" } },
    });

    renderWithRouter(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/^email$/i), "bad@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Invalid Credentials",
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalledWith("/app");
    });
  });

  test("on 403 unverified email: shows warning toast and navigates to /verify-email", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: {
        status: 403,
        data: { message: "Please verify your email first" },
      },
    });

    renderWithRouter(<LoginPage />);
    await userEvent.type(
      screen.getByLabelText(/^email$/i),
      "unverified@test.com",
    );
    await userEvent.type(screen.getByLabelText(/^password$/i), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          title: "Email Not Verified",
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        "/verify-email",
        expect.objectContaining({
          state: { pendingEmail: "unverified@test.com" },
        }),
      );
    });
  });

  test("clicking Forgot Password? navigates to /forgot-password", async () => {
    renderWithRouter(<LoginPage />);
    await userEvent.click(
      screen.getByRole("button", { name: /forgot password\?/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
  });

  test("clicking Sign up navigates to /register", async () => {
    renderWithRouter(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });

  test("on generic server error: shows Login Failed toast with server message", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { status: 500, data: { message: "Internal server error" } },
    });

    renderWithRouter(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/^email$/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Login Failed",
          message: "Internal server error",
        }),
      );
    });
  });
});

describe("RegistrationPage — Step 1: Role Selection", () => {
  beforeEach(() => vi.clearAllMocks());

  test("renders all 4 role labels", () => {
    renderWithRouter(<RegistrationPage />);
    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.getByText("Startup")).toBeInTheDocument();
    expect(screen.getByText("Expert")).toBeInTheDocument();
    expect(screen.getByText("Investor")).toBeInTheDocument();
  });

  test("renders 'Choose Your Role' heading", () => {
    renderWithRouter(<RegistrationPage />);
    expect(screen.getByText(/choose your role/i)).toBeInTheDocument();
  });

  test("Continue is DISABLED before selecting a role", () => {
    renderWithRouter(<RegistrationPage />);
    expect(screen.getByRole("button", { name: /^continue$/i })).toBeDisabled();
  });

  test("Continue is ENABLED after selecting a role", async () => {
    renderWithRouter(<RegistrationPage />);
    await userEvent.click(screen.getByText("Member"));
    expect(
      screen.getByRole("button", { name: /^continue$/i }),
    ).not.toBeDisabled();
  });

  test("clicking a role shows the 'Selected' indicator", async () => {
    renderWithRouter(<RegistrationPage />);
    await userEvent.click(screen.getByText("Startup"));
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  test("only one 'Selected' indicator at a time", async () => {
    renderWithRouter(<RegistrationPage />);
    await userEvent.click(screen.getByText("Member"));
    await userEvent.click(screen.getByText("Investor"));
    expect(screen.getAllByText("Selected")).toHaveLength(1);
  });

  test("clicking Continue advances to Step 2", async () => {
    renderWithRouter(<RegistrationPage />);
    await userEvent.click(screen.getByText("Expert"));
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.getByText(/basic information/i)).toBeInTheDocument();
  });
});

describe("RegistrationPage — Step 2: Basic Info Validation", () => {
  async function goToStep2(role = "Member") {
    renderWithRouter(<RegistrationPage />);
    await userEvent.click(screen.getByText(role));
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.getByText(/basic information/i)).toBeInTheDocument();
  }

  beforeEach(() => vi.clearAllMocks());

  test("renders Full Name, Email, Password, Confirm Password labels", async () => {
    await goToStep2();
    expect(screen.getByText(/full name/i)).toBeInTheDocument();
    expect(screen.getByText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm password/i)).toBeInTheDocument();
  });

  test("shows 'Missing fields' warning when Continue clicked with empty fields", async () => {
    await goToStep2();
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "warning", title: "Missing fields" }),
      );
    });
  });

  test("shows 'Weak password' error when password is less than 8 chars", async () => {
    await goToStep2();
    const textInputs = screen.getAllByRole("textbox");
    await userEvent.type(textInputs[0], "John Doe");
    await userEvent.type(textInputs[1], "john@example.com");
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "abc" } });
    fireEvent.change(pwInputs[1], { target: { value: "abc" } });
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Weak password" }),
      );
    });
  });

  test("shows 'Weak password' error when password has no uppercase", async () => {
    await goToStep2();
    const textInputs = screen.getAllByRole("textbox");
    await userEvent.type(textInputs[0], "Jane Smith");
    await userEvent.type(textInputs[1], "jane@example.com");
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "alllower1" } });
    fireEvent.change(pwInputs[1], { target: { value: "alllower1" } });
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Weak password" }),
      );
    });
  });

  test("shows 'Weak password' error when password has no number", async () => {
    await goToStep2();
    const textInputs = screen.getAllByRole("textbox");
    await userEvent.type(textInputs[0], "Jane Smith");
    await userEvent.type(textInputs[1], "jane@example.com");
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "NoNumbersHere" } });
    fireEvent.change(pwInputs[1], { target: { value: "NoNumbersHere" } });
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Weak password" }),
      );
    });
  });

  test("shows 'Weak password' error when password has no lowercase", async () => {
    await goToStep2();
    const textInputs = screen.getAllByRole("textbox");
    await userEvent.type(textInputs[0], "Test User");
    await userEvent.type(textInputs[1], "test@example.com");
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "ALLUPPERCASE1" } });
    fireEvent.change(pwInputs[1], { target: { value: "ALLUPPERCASE1" } });
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Weak password" }),
      );
    });
  });

  test("shows 'Password mismatch' error when passwords do not match", async () => {
    await goToStep2();
    const textInputs = screen.getAllByRole("textbox");
    await userEvent.type(textInputs[0], "Alice Wonder");
    await userEvent.type(textInputs[1], "alice@example.com");
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "StrongPass1" } });
    fireEvent.change(pwInputs[1], { target: { value: "DifferentPass1" } });
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Password mismatch" }),
      );
    });
  });

  test("PasswordStrengthBar appears after typing in password field", async () => {
    await goToStep2();
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "abc" } });
    await waitFor(() => {
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });
  });

  test("PasswordStrengthBar shows Strong for ValidPass1!", async () => {
    await goToStep2();
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "ValidPass1!" } });
    await waitFor(() => {
      expect(
        screen.getByText(/password strength: strong/i),
      ).toBeInTheDocument();
    });
  });

  test("advances to Step 3 with valid data", async () => {
    await goToStep2("Member");
    const textInputs = screen.getAllByRole("textbox");
    await userEvent.type(textInputs[0], "Valid User");
    await userEvent.type(textInputs[1], "valid@example.com");
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "ValidPass1" } });
    fireEvent.change(pwInputs[1], { target: { value: "ValidPass1" } });
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/ready to join as a member/i),
      ).toBeInTheDocument();
    });
  });

  test("Back button returns to Step 1", async () => {
    await goToStep2();
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByText(/choose your role/i)).toBeInTheDocument();
  });
});

describe("RegistrationPage — Step 3: Role details and submission", () => {
  async function goToStep3(role: "Member" | "Startup" | "Expert" | "Investor") {
    renderWithRouter(<RegistrationPage />);
    await userEvent.click(screen.getByText(role));
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    const textInputs = screen.getAllByRole("textbox");
    await userEvent.type(textInputs[0], "Test User");
    await userEvent.type(textInputs[1], "test@example.com");
    const pwInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    fireEvent.change(pwInputs[0], { target: { value: "ValidPass1" } });
    fireEvent.change(pwInputs[1], { target: { value: "ValidPass1" } });
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await waitFor(() => {
      const indicators = [
        /ready to join as a member/i,
        /company details/i,
        /expert details/i,
        /ready to join as an investor/i,
      ];
      const found = indicators.some((p) => screen.queryByText(p));
      expect(found).toBe(true);
    });
  }

  beforeEach(() => vi.clearAllMocks());

  test("MEMBER: shows summary and 'Complete Registration' button", async () => {
    await goToStep3("Member");
    expect(screen.getByText(/ready to join as a member/i)).toBeInTheDocument();
    expect(screen.getByText("Complete Registration")).toBeInTheDocument();
  });

  test("MEMBER: summary shows name and email from step 2", async () => {
    await goToStep3("Member");
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  test("STARTUP: shows Company Name and Startup Stage fields", async () => {
    await goToStep3("Startup");
    expect(screen.getByText(/company name/i)).toBeInTheDocument();
    expect(screen.getByText(/startup stage/i)).toBeInTheDocument();
  });

  test("EXPERT: shows Expertise and Hourly Rate fields", async () => {
    await goToStep3("Expert");
    expect(screen.getByText(/^expertise$/i)).toBeInTheDocument();
    expect(screen.getByText(/hourly rate/i)).toBeInTheDocument();
  });

  test("INVESTOR: shows investor welcome and wizard teaser text", async () => {
    await goToStep3("Investor");
    expect(
      screen.getByText(/ready to join as an investor/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/investment thesis/i)).toBeInTheDocument();
  });

  test("on success: shows 'Check your email' toast and navigates to /login", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: "ok" } });
    await goToStep3("Member");
    await userEvent.click(
      screen.getByRole("button", { name: /complete registration/i }),
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", title: "Check your email" }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("api.post called with correct payload", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: "ok" } });
    await goToStep3("Member");
    await userEvent.click(
      screen.getByRole("button", { name: /complete registration/i }),
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/auth/register",
        expect.objectContaining({
          name: "Test User",
          email: "test@example.com",
          password: "ValidPass1",
          role: "member",
        }),
      );
    });
  });

  test("on server error: shows 'Registration Failed' error toast", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { status: 400, data: { message: "User already exists" } },
    });
    await goToStep3("Member");
    await userEvent.click(
      screen.getByRole("button", { name: /complete registration/i }),
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Registration Failed",
          message: "User already exists",
        }),
      );
    });
  });

  test("shows 'Creating account...' and button disabled while submitting", async () => {
    vi.mocked(api.post).mockReturnValue(new Promise(() => {}));
    await goToStep3("Member");
    await userEvent.click(
      screen.getByRole("button", { name: /complete registration/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /creating account/i }),
      ).toBeDisabled();
    });
  });

  test("Back button returns to Step 2", async () => {
    await goToStep3("Member");
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByText(/basic information/i)).toBeInTheDocument();
  });
});

describe("ResetPasswordPage", () => {
  function renderResetPage(search = "?token=valid-reset-token-123") {
    return render(
      <MemoryRouter initialEntries={[`/reset-password${search}`]}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );
  }

  beforeEach(() => vi.clearAllMocks());

  test("renders 'Reset Password' heading", () => {
    renderResetPage();
    expect(
      screen.getByRole("heading", { name: /^reset password$/i }),
    ).toBeInTheDocument();
  });

  test("renders New Password and Confirm Password inputs", () => {
    renderResetPage();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test("renders 'Reset Password' submit button", () => {
    renderResetPage();
    expect(
      screen.getByRole("button", { name: /^reset password$/i }),
    ).toBeInTheDocument();
  });

  test("renders 'Back to login' button", () => {
    renderResetPage();
    expect(
      screen.getByRole("button", { name: /^back to login$/i }),
    ).toBeInTheDocument();
  });

  test("shows 'Password Mismatch' warning when passwords don't match", async () => {
    renderResetPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "StrongPass1" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "DifferentPass1" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^reset password$/i }),
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          title: "Password Mismatch",
        }),
      );
    });
  });

  test("shows 'Weak Password' warning when password is < 8 chars", async () => {
    renderResetPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "short" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^reset password$/i }),
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          title: "Weak Password",
        }),
      );
    });
  });

  test("PasswordStrengthBar appears when typing new password", async () => {
    renderResetPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "abc" },
    });
    await waitFor(() => {
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });
  });

  test("api.post is NOT called when validation fails", async () => {
    renderResetPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "short" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^reset password$/i }),
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  test("on success: shows 'Password successfully updated' message", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderResetPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "NewStrong1!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "NewStrong1!" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^reset password$/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/password successfully updated/i),
      ).toBeInTheDocument();
    });
  });

  test("on success: shows 'Password Updated 🎉' toast", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderResetPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "NewStrong1!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "NewStrong1!" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^reset password$/i }),
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Password Updated 🎉",
        }),
      );
    });
  });

  test("api.post called with correct token and newPassword", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderResetPage("?token=my-reset-token-xyz");
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "NewStrong1!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "NewStrong1!" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^reset password$/i }),
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/auth/reset-password",
        expect.objectContaining({
          token: "my-reset-token-xyz",
          newPassword: "NewStrong1!",
        }),
      );
    });
  });

  test("on server error: shows error toast and inline error message", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { status: 400, data: { message: "Invalid or expired token" } },
    });
    renderResetPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "NewStrong1!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "NewStrong1!" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^reset password$/i }),
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Reset Failed" }),
      );
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
    });
  });

  test("shows 'Updating...' and disables button while submitting", async () => {
    vi.mocked(api.post).mockReturnValue(new Promise(() => {}));
    renderResetPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "NewStrong1!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "NewStrong1!" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^reset password$/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/^updating\.\.\.$/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^updating\.\.\.$/i }),
      ).toBeDisabled();
    });
  });

  test("clicking 'Back to login' navigates to /login", async () => {
    renderResetPage();
    await userEvent.click(
      screen.getByRole("button", { name: /^back to login$/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});

describe("VerifyEmailPage", () => {
  beforeEach(() => vi.clearAllMocks());

  test("without token: renders 'Verify your email' heading", async () => {
    renderWithRouter(<VerifyEmailPage />);
    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });
  });

  test("without token: shows Resend verification email button", async () => {
    renderWithRouter(<VerifyEmailPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /resend verification email/i }),
      ).toBeInTheDocument();
    });
  });

  test("without token: shows Back to Login button", async () => {
    renderWithRouter(<VerifyEmailPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /back to login/i }),
      ).toBeInTheDocument();
    });
  });

  test("without token: shows info toast asking user to check email", async () => {
    renderWithRouter(<VerifyEmailPage />);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "info",
          title: "Verification Required",
        }),
      );
    });
  });

  test("with valid token: shows 'Verifying...' initially", () => {
    vi.mocked(api.post).mockReturnValue(new Promise(() => {}));
    renderWithRouter(<VerifyEmailPage />, "?token=valid-token-abc");
    expect(screen.getByText(/^verifying\.\.\.$/i)).toBeInTheDocument();
  });

  test("with valid token: calls /auth/verify-email with the token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderWithRouter(<VerifyEmailPage />, "?token=valid-token-abc");

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/auth/verify-email",
        expect.objectContaining({ token: "valid-token-abc" }),
      );
    });
  });

  test("with valid token: shows 'Email successfully verified.' message", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderWithRouter(<VerifyEmailPage />, "?token=valid-token-abc");

    await waitFor(() => {
      expect(
        screen.getByText(/email successfully verified/i),
      ).toBeInTheDocument();
    });
  });

  test("with valid token: shows success toast", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderWithRouter(<VerifyEmailPage />, "?token=valid-token-abc");

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Email Verified 🎉",
        }),
      );
    });
  });

  test("with valid token: resend button is NOT shown", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderWithRouter(<VerifyEmailPage />, "?token=valid-token-abc");

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /resend verification email/i }),
      ).not.toBeInTheDocument();
    });
  });

  test("with bad token: shows inline error message from server", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: {
        status: 400,
        data: { message: "Invalid or expired verification link." },
      },
    });
    renderWithRouter(<VerifyEmailPage />, "?token=bad-token");

    await waitFor(() => {
      expect(
        screen.getByText(/invalid or expired verification link/i),
      ).toBeInTheDocument();
    });
  });

  test("with bad token: shows error toast", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: {
        status: 400,
        data: { message: "Invalid or expired verification link." },
      },
    });
    renderWithRouter(<VerifyEmailPage />, "?token=bad-token");

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Verification Failed",
        }),
      );
    });
  });

  test("clicking Back to Login navigates to /login", async () => {
    renderWithRouter(<VerifyEmailPage />);
    await waitFor(() => {
      screen.getByRole("button", { name: /back to login/i });
    });
    await userEvent.click(
      screen.getByRole("button", { name: /back to login/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
