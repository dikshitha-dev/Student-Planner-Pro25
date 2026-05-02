import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  accentColor: string;
  onPress?: () => void;
  trend?: string;
}

export function StatCard({ icon, label, value, unit, accentColor, onPress, trend }: StatCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.8 : 1} style={s.outer}>
      <View style={[s.card, { backgroundColor: colors.card, shadowColor: accentColor }]}>
        <LinearGradient
          colors={[accentColor + "22", accentColor + "08"]}
          style={s.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[s.iconRing, { backgroundColor: accentColor + "22" }]}>{icon}</View>
        <Text style={[s.value, { color: colors.foreground }]}>{value}</Text>
        {unit ? <Text style={[s.unit, { color: accentColor }]}>{unit}</Text> : null}
        <Text style={[s.label, { color: colors.mutedForeground }]}>{label}</Text>
        {trend ? (
          <View style={[s.trend, { backgroundColor: accentColor + "18" }]}>
            <Text style={[s.trendText, { color: accentColor }]}>{trend}</Text>
          </View>
        ) : null}
        <View style={[s.accentBar, { backgroundColor: accentColor }]} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  card: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  value: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  unit: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginTop: -2 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  trend: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  trendText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  accentBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },
});
