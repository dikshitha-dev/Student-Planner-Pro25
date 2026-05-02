import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function PlannerLayout() {
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
      <Stack.Screen name="index" options={{ title: "Study Planner" }} />
      <Stack.Screen name="add" options={{ title: "Add Subject" }} />
      <Stack.Screen name="plan" options={{ title: "Study Plan" }} />
    </Stack>
  );
}
