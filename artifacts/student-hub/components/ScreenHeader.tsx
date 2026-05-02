import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "../context/ThemeContext";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  gradient?: boolean;
}

export function ScreenHeader({ title, subtitle, rightElement, gradient = false }: ScreenHeaderProps) {
  const colors = useColors();
  const { toggleTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const headerContent = (
    <View style={[s.container, { paddingTop: topPad + 16 }]}>
      <View style={s.row}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[s.themeBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(99,102,241,0.1)" }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={18}
            color={isDark ? "#FCD34D" : colors.primary}
          />
        </TouchableOpacity>

        <View style={s.titleBlock}>
          <Text
            style={[s.title, { color: gradient ? "#FFF" : colors.foreground }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[s.subtitle, { color: gradient ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={s.rightSlot}>
          {rightElement ?? <View style={s.placeholder} />}
        </View>
      </View>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  return (
    <View style={{ backgroundColor: colors.headerBg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {headerContent}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
  rightSlot: { width: 38, alignItems: "flex-end" },
  placeholder: { width: 38 },
});
