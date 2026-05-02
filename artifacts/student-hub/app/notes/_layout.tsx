import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function NotesLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "My Notes" }} />
      <Stack.Screen name="new" options={{ title: "New Note" }} />
    </Stack>
  );
}
