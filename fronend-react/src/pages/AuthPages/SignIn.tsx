import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Asset Management System"
        description="Sign in to the Asset Management System dashboard."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
