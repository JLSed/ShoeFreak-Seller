import { FaCheckCircle } from "react-icons/fa";

function AccountVerifiedPage() {
  return (
    <div className="bg-green-900 min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <FaCheckCircle className="text-green-600 text-6xl" />
        </div>

        <h1 className="text-2xl font-semibold mb-4">
          Account Successfully Created!
        </h1>

        <p className="text-gray-600 mb-8">
          Thank you for registering with ShoeFreak. You may now log in using
          your email and password.
        </p>

        <div className="w-full px-4 py-3 bg-gray-300 text-black rounded-lg">
          You can now exit to this tab
        </div>
      </div>
    </div>
  );
}

export default AccountVerifiedPage;
