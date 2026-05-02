import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { useCreatePlannerSubject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlannerSubjectsQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function AddSubjectScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [priority, setPriority] = useState(3);
  const [hoursNeeded, setHoursNeeded] = useState(4);
  const createMutation = useCreatePlannerSubject();

  const handleSave = async () => {
    if (!name.trim() || !examDate.trim()) {
      Alert.alert("Error", "Please enter subject name and exam date");
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(examDate)) {
      Alert.alert("Error", "Date format should be YYYY-MM-DD (e.g. 2025-12-15)");
      return;
    }
    try {
      await createMutation.mutateAsync({
        data: { name: name.trim(), examDate, priority, hoursNeeded },
      });
      queryClient.invalidateQueries({ queryKey: getGetPlannerSubjectsQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to add subject");
    }
  };

  const PRIORITY_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#F97316", "#EF4444"];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>Subject Name</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Calculus, Physics, History"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>Exam Date (YYYY-MM-DD)</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={examDate}
            onChangeText={setExamDate}
            placeholder="2025-12-15"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>Priority (1=Low, 5=High)</Text>
          <View style={s.priorityRow}>
            {[1, 2, 3, 4, 5].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  s.priorityBtn,
                  {
                    backgroundColor: priority === p ? PRIORITY_COLORS[p - 1]! : colors.card,
                    borderColor: priority === p ? PRIORITY_COLORS[p - 1]! : colors.border,
                  },
                ]}
                onPress={() => setPriority(p)}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: priority === p ? "#FFF" : colors.mutedForeground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                }}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>Hours Needed to Prepare</Text>
          <View style={s.hoursRow}>
            <TouchableOpacity
              style={[s.hoursBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setHoursNeeded(Math.max(0.5, hoursNeeded - 0.5))}
              activeOpacity={0.8}
            >
              <Text style={{ color: colors.foreground, fontSize: 18, fontFamily: "Inter_500Medium" }}>−</Text>
            </TouchableOpacity>
            <View style={[s.hoursDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.foreground, fontSize: 22, fontFamily: "Inter_700Bold" }}>{hoursNeeded}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" }}>hours</Text>
            </View>
            <TouchableOpacity
              style={[s.hoursBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setHoursNeeded(Math.min(40, hoursNeeded + 0.5))}
              activeOpacity={0.8}
            >
              <Text style={{ color: colors.foreground, fontSize: 18, fontFamily: "Inter_500Medium" }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: colors.primary }, createMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={createMutation.isPending}
          activeOpacity={0.8}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={s.saveBtnText}>Add Subject</Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const s = StyleSheet.create({
  fieldGroup: { gap: 10 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  hoursRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  hoursBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  hoursDisplay: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
