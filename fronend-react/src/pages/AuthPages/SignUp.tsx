import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sign Up | Asset Management System"
        description="Create an account for the Asset Management System."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
