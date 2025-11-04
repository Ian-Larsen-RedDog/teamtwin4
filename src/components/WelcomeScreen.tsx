"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import TeamSetupScreen, {
  type Capability,
  type StaffMember,
  normalizeTeamSetupData,
} from "@/components/TeamSetupScreen";
import WorkflowTemplateSetup from "@/components/WorkflowTemplateSetup";

export default function WelcomeScreen() {
  const [teamId, setTeamId] = React.useState("");
  const [teamName, setTeamName] = React.useState("");
  const [stage, setStage] = React.useState<
    "welcome" | "team-setup" | "workflow-setup"
  >("welcome");
  const [capabilities, setCapabilities] = React.useState<Capability[]>([
    { id: "default-capability", code: "C1", description: "Capability 1" },
  ]);
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>([
    {
      id: "default-staff",
      code: "S1",
      name: "Staff one",
      capacity: 1,
      capabilityIds: [],
    },
  ]);

  const isValid = teamId.trim() && teamName.trim();

  React.useEffect(() => {
    if (stage !== "team-setup" || !teamId || typeof window === "undefined") {
      return;
    }

    try {
      const saved = window.localStorage.getItem(`team-setup-${teamId}`);
      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);
      const normalized = normalizeTeamSetupData(parsed);
      if (!normalized) {
        return;
      }

      setCapabilities(normalized.capabilities);
      setStaffMembers(normalized.staffMembers);
    } catch (error) {
      console.error("Unable to restore saved team setup", error);
    }
  }, [stage, teamId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setStage("team-setup");
  }

  const handleContinue = React.useCallback(() => {
    setStage("workflow-setup");
  }, []);

  const handleBackToTeamSetup = React.useCallback(() => {
    setStage("team-setup");
  }, []);

  const handleFinishWorkflow = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.close();
    }
    setStage("welcome");
  }, []);

  return (
    <AnimatePresence mode="wait">
      {stage === "team-setup" ? (
        <motion.div
          key="team-setup"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
        >
          <TeamSetupScreen
            teamName={teamName}
            teamCode={teamId}
            capabilities={capabilities}
            setCapabilities={setCapabilities}
            staffMembers={staffMembers}
            setStaffMembers={setStaffMembers}
            onContinue={handleContinue}
          />
        </motion.div>
      ) : stage === "workflow-setup" ? (
        <motion.div
          key="workflow-setup"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
        >
          <WorkflowTemplateSetup
            teamName={teamName}
            capabilities={capabilities}
            onBack={handleBackToTeamSetup}
            onFinish={handleFinishWorkflow}
          />
        </motion.div>
      ) : (
        <motion.div
          key="welcome"
          className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="w-[400px] max-w-full rounded-2xl p-6 shadow-xl">
            <CardContent className="flex flex-col gap-4">
              <h1 className="mb-2 text-center text-2xl font-bold">
                <span className="block">Software Development Team</span>
                <span className="block">Digital Twin Simulation</span>
              </h1>
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium">Team ID</label>
                  <Input
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    placeholder="Enter your Team ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Team Name</label>
                  <Input
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="Enter your Team Name"
                    className="mt-1"
                  />
                </div>
                <Button className="mt-2 w-full" type="submit" disabled={!isValid}>
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
