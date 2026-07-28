// Client-side service - uses API route for state operations

export const getAllStatesService = async () => {
  try {
    const res = await fetch("/api/states");
    const data = await res.json();
    return data.states || [];
  } catch (error) {
    console.error('Error fetching states:', error);
    return [];
  }
};