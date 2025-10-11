import { useDispatch } from "react-redux";
import { handleUserKeys } from "../feature/keySlice";

export function usePrivateKeyManager() {
  const dispatch = useDispatch();

  const setupKeys = async (userId) => {
    console.log("setupKeys called");
    if (!userId) throw new Error("Missing userId for key setup");
    await dispatch(handleUserKeys(userId));
  };

  return { setupKeys };
}
