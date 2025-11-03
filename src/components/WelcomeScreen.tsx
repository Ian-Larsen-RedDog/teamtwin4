"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function WelcomeScreen() {
  const [teamId, setTeamId] = React.useState("");
  const [teamName, setTeamName] = React.useState("");
  const isValid = teamId.trim() && teamName.trim();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    console.log({ teamId, teamName }); // replace with server action/API later
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Card className="w-[400px] max-w-full shadow-xl rounded-2xl p-6">
          <CardContent className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-center mb-2">
              <span className="block">Software Development Team</span>
              <span className="block">Digital Twin Simulation</span>
            </h1>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium">Team ID</label>
                <Input value={teamId} onChange={e => setTeamId(e.target.value)} placeholder="Enter your Team ID" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Team Name</label>
                <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter your Team Name" className="mt-1" />
              </div>
              <Button className="mt-2 w-full" type="submit" disabled={!isValid}>Continue</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
