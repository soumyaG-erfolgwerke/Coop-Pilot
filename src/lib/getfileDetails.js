
// get file details by userId.
export const getFilebyUserId = async (userId) => {
    try {
        if (!userId) {
            return {
                success: false,
                error: { message: "userId is required" }
            };
        }

        const res = await fetch(`/api/userServices/fileDetails?userId=${userId}`);
        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                error: data.error || { message: "Failed to fetch file details" }
            };
        }

        return {
            success: true,
            data
        };

    } catch (error) {
        console.error("Fetch KYC Error:", error);
        return {
            success: false,
            error: { message: error.message }
        };
    }
};