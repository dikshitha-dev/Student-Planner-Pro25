import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function NotesLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Notes" }} />
      <Stack.Screen name="new" options={{ title: "New Note" }} />
    </Stack>
  );
}
