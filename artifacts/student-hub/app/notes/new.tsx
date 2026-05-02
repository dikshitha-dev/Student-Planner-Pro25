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
import { useCreateNote } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetNotesQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export default function NewNoteScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const createMutation = useCreateNote();

  const handleSummarize = async () => {
    if (!title.trim() || !text.trim()) {
      Alert.alert("Error", "Please enter a title and some text to summarize");
      return;
    }
    if (text.trim().length < 50) {
      Alert.alert("Error", "Text is too short to summarize. Please paste more content.");
      return;
    }
    try {
      const note = await createMutation.mutateAsync({
        data: { title: title.trim(), originalText: text.trim() },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult(note.summary);
      queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to summarize note");
    }
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {!result ? (
          <>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Title</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Photosynthesis Chapter 3"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Paste Your Text</Text>
            <TextInput
              style={[s.textArea, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={text}
              onChangeText={setText}
              placeholder="Paste the long text you want summarized here..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
            />

            <Text style={[s.charCount, { color: colors.mutedForeground }]}>
              {text.length} characters
            </Text>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.primary }, createMutation.isPending && { opacity: 0.6 }]}
              onPress={handleSummarize}
              disabled={createMutation.isPending}
              activeOpacity={0.8}
            >
              {createMutation.isPending ? (
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={s.btnText}>Summarizing...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Ionicons name="sparkles-outline" size={18} color="#FFF" />
                  <Text style={s.btnText}>Summarize with AI</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.resultContainer}>
            <View style={[s.successBanner, { backgroundColor: (colors as Record<string, string>).success + "22", borderColor: (colors as Record<string, string>).success + "44" }]}>
              <Ionicons name="checkmark-circle" size={20} color={(colors as Record<string, string>).success} />
              <Text style={[s.successText, { color: (colors as Record<string, string>).success }]}>Summary generated!</Text>
            </View>

            <Text style={[s.resultTitle, { color: colors.foreground }]}>{title}</Text>

            <View style={[s.summaryCard, { backgroundColor: colors.card }]}>
              <View style={[s.summaryBadge, { backgroundColor: colors.primary + "22" }]}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={[s.summaryBadgeText, { color: colors.primary }]}>AI Summary</Text>
              </View>
              <Text style={[s.summaryText, { color: colors.foreground }]}>{result}</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.secondary, flex: 1 }]}
                onPress={() => { setResult(null); setTitle(""); setText(""); }}
              >
                <Text style={[s.btnText, { color: colors.foreground }]}>New Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleDone}
              >
                <Text style={s.btnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const s = StyleSheet.create({
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 8, letterSpacing: 0.4 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 220,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    borderWidth: 1,
    marginBottom: 8,
  },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right", marginBottom: 20 },
  btn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  btnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  resultContainer: { gap: 16 },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  successText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resultTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  summaryCard: { borderRadius: 16, padding: 16, gap: 12 },
  summaryBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  summaryBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  summaryText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
