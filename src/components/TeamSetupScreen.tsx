"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Capability = {
  id: string;
  code: string;
  description: string;
};

export type StaffMember = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  capabilityIds: string[];
};

export type TeamSetupData = {
  capabilities: Capability[];
  staffMembers: StaffMember[];
};

interface TeamSetupScreenProps {
  teamName: string;
  teamCode: string;
  capabilities: Capability[];
  setCapabilities: React.Dispatch<React.SetStateAction<Capability[]>>;
  staffMembers: StaffMember[];
  setStaffMembers: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  onContinue?: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function normalizeTeamSetupData(raw: unknown): TeamSetupData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const maybeData = raw as Partial<TeamSetupData> & {
    capabilities?: unknown;
    staffMembers?: unknown;
  };

  if (!Array.isArray(maybeData.capabilities) || !Array.isArray(maybeData.staffMembers)) {
    return null;
  }

  const capabilities: Capability[] = maybeData.capabilities.map(rawCapability => {
    const capability = rawCapability as Partial<Capability> | undefined;
    const id = capability?.id && typeof capability.id === "string" && capability.id.trim()
      ? capability.id.trim()
      : generateId();
    return {
      id,
      code: typeof capability?.code === "string" ? capability.code : "",
      description: typeof capability?.description === "string" ? capability.description : "",
    } as Capability;
  });

  const validCapabilityIds = new Set(capabilities.map(capability => capability.id));

  const staffMembers: StaffMember[] = maybeData.staffMembers.map(rawMember => {
    const member = rawMember as Partial<StaffMember> | undefined;
    const id = member?.id && typeof member.id === "string" && member.id.trim()
      ? member.id.trim()
      : generateId();

    const rawCapacity =
      typeof member?.capacity === "number" && Number.isFinite(member.capacity)
        ? member.capacity
        : 1;
    const normalizedCapacity = Math.min(Math.max(rawCapacity, 0.5), 1.5);

    return {
      id,
      code: typeof member?.code === "string" ? member.code : "",
      name: typeof member?.name === "string" ? member.name : "",
      capacity: normalizedCapacity,
      capabilityIds: Array.isArray(member?.capabilityIds)
        ? member.capabilityIds.filter(
            capabilityId => typeof capabilityId === "string" && validCapabilityIds.has(capabilityId)
          )
        : [],
    } as StaffMember;
  });

  return { capabilities, staffMembers } as TeamSetupData;
}

export default function TeamSetupScreen({
  teamName,
  teamCode,
  capabilities,
  setCapabilities,
  staffMembers,
  setStaffMembers,
  onContinue,
}: TeamSetupScreenProps) {
  const [feedback, setFeedback] = React.useState<
    | { type: "success" | "error"; message: string }
    | null
  >(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sanitizedTeamCode = React.useMemo(() => {
    const base = teamCode?.trim() || teamName?.trim() || "team";
    return base.replace(/[^a-z0-9_-]/gi, "_");
  }, [teamCode, teamName]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !teamCode) {
      return;
    }

    const payload = JSON.stringify(
      {
        teamCode,
        teamName,
        capabilities,
        staffMembers,
        savedAt: new Date().toISOString(),
      },
      null,
      2
    );

    window.localStorage.setItem(`team-setup-${teamCode}`, payload);
  }, [capabilities, staffMembers, teamCode, teamName]);

  const getNextCapabilityCode = React.useCallback(() => {
    const numericValues = capabilities
      .map(cap => parseInt(cap.code.replace(/\D/g, ""), 10))
      .filter(num => !Number.isNaN(num));
    const nextNumber = numericValues.length ? Math.max(...numericValues) + 1 : 1;
    return `C${nextNumber}`;
  }, [capabilities]);

  const getNextStaffCode = React.useCallback(() => {
    const numericValues = staffMembers
      .map(member => parseInt(member.code.replace(/\D/g, ""), 10))
      .filter(num => !Number.isNaN(num));
    const nextNumber = numericValues.length ? Math.max(...numericValues) + 1 : 1;
    return `S${nextNumber}`;
  }, [staffMembers]);

  const handleCapabilityChange = (
    capabilityId: string,
    key: keyof Pick<Capability, "code" | "description">,
    value: string
  ) => {
    setCapabilities(prev =>
      prev.map(cap => (cap.id === capabilityId ? { ...cap, [key]: value } : cap))
    );
  };

  const handleDeleteCapability = (capabilityId: string) => {
    setCapabilities(prev => prev.filter(cap => cap.id !== capabilityId));
    setStaffMembers(prev =>
      prev.map(member => ({
        ...member,
        capabilityIds: member.capabilityIds.filter(id => id !== capabilityId),
      }))
    );
  };

  const handleAddCapability = () => {
    const nextCode = getNextCapabilityCode();
    const newCapability: Capability = {
      id: generateId(),
      code: nextCode,
      description: `Capability ${nextCode.replace(/\D/g, "") || ""}`.trim(),
    };
    setCapabilities(prev => [...prev, newCapability]);
  };

  const handleStaffChange = (
    staffId: string,
    key: keyof Pick<StaffMember, "code" | "name">,
    value: string
  ) => {
    setStaffMembers(prev =>
      prev.map(member => (member.id === staffId ? { ...member, [key]: value } : member))
    );
  };

  const handleDeleteStaffMember = (staffId: string) => {
    setStaffMembers(prev => prev.filter(member => member.id !== staffId));
  };

  const handleAddStaffMember = () => {
    const nextCode = getNextStaffCode();
    const newMember: StaffMember = {
      id: generateId(),
      code: nextCode,
      name: `Staff ${nextCode.replace(/\D/g, "") || ""}`.trim(),
      capacity: 1,
      capabilityIds: [],
    };
    setStaffMembers(prev => [...prev, newMember]);
  };

  const handleStaffCapacityChange = (staffId: string, rawValue: string) => {
    const numericValue = Number(rawValue);

    setStaffMembers(prev =>
      prev.map(member => {
        if (member.id !== staffId) {
          return member;
        }

        if (rawValue.trim() === "") {
          return { ...member, capacity: 1 };
        }

        if (Number.isNaN(numericValue)) {
          return { ...member, capacity: 1 };
        }

        const normalized = Math.min(Math.max(numericValue / 100, 0.5), 1.5);
        return {
          ...member,
          capacity: Math.round(normalized * 100) / 100,
        };
      })
    );
  };

  const toggleStaffCapability = (staffId: string, capabilityId: string) => {
    setStaffMembers(prev =>
      prev.map(member => {
        if (member.id !== staffId) return member;
        const hasCapability = member.capabilityIds.includes(capabilityId);
        return {
          ...member,
          capabilityIds: hasCapability
            ? member.capabilityIds.filter(id => id !== capabilityId)
            : [...member.capabilityIds, capabilityId],
        };
      })
    );
  };

  const handleSaveTeam = () => {
    try {
      const payload = {
        teamCode,
        teamName,
        capabilities,
        staffMembers,
        savedAt: new Date().toISOString(),
      };

      const fileName = `${sanitizedTeamCode || "team"}_Team_Setup.json`;
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setFeedback({ type: "success", message: `Team setup saved as ${fileName}.` });
    } catch (error) {
      console.error("Failed to save team setup", error);
      setFeedback({ type: "error", message: "Unable to save the team setup." });
    }
  };

  const handleLoadTeamClick = () => {
    fileInputRef.current?.click();
  };

  const handleLoadTeam: React.ChangeEventHandler<HTMLInputElement> = event => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const normalized = normalizeTeamSetupData(parsed);

        if (!normalized) {
          throw new Error("Invalid team setup file structure");
        }

        setCapabilities(normalized.capabilities);
        setStaffMembers(normalized.staffMembers);
        setFeedback({ type: "success", message: `Team setup loaded from ${file.name}.` });
      } catch (error) {
        console.error("Failed to load team setup", error);
        setFeedback({
          type: "error",
          message: "Unable to load the selected team setup file.",
        });
      }
    };

    reader.readAsText(file);
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Team Setup for <span className="text-primary">{teamName}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure team capabilities and assign them to each staff member.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleLoadTeamClick}>
              Load Team
            </Button>
            <Button type="button" variant="outline" onClick={handleSaveTeam}>
              Save Team
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleLoadTeam}
            />
          </div>
          <Button type="button" variant="default" onClick={handleContinue}>
            Continue
          </Button>
        </div>

        {feedback ? (
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
            role="status"
            aria-live="polite"
          >
            {feedback.message}
          </div>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Capabilities</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage the list of capabilities available to your team.
              </p>
            </div>
            <Button type="button" onClick={handleAddCapability}>
              Add Capability
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Capability Code
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Capability Description
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {capabilities.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-sm text-gray-500"
                        colSpan={3}
                      >
                        No capabilities added yet.
                      </td>
                    </tr>
                  ) : (
                    capabilities.map(capability => (
                      <tr key={capability.id}>
                        <td className="px-4 py-3">
                          <Input
                            value={capability.code}
                            onChange={event =>
                              handleCapabilityChange(
                                capability.id,
                                "code",
                                event.target.value
                              )
                            }
                            placeholder="e.g. C1"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={capability.description}
                            onChange={event =>
                              handleCapabilityChange(
                                capability.id,
                                "description",
                                event.target.value
                              )
                            }
                            placeholder="Capability description"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteCapability(capability.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Team Members</CardTitle>
              <p className="text-sm text-muted-foreground">
                Assign capabilities to each staff member on your team.
              </p>
            </div>
            <Button type="button" onClick={handleAddStaffMember}>
              Add Staff Member
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Staff Code
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Staff Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Capacity (%)
                    </th>
                    {capabilities.map(capability => (
                      <th
                        key={capability.id}
                        className="px-4 py-2 text-center text-sm font-semibold text-gray-700"
                      >
                        <div className="flex flex-col items-center gap-0.5 text-xs">
                          <span className="text-sm font-medium text-gray-900">
                            {capability.code || "Code"}
                          </span>
                          <span className="text-muted-foreground">
                            {capability.description || "Description"}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {staffMembers.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-sm text-gray-500"
                        colSpan={capabilities.length + 4}
                      >
                        No staff members added yet.
                      </td>
                    </tr>
                  ) : (
                    staffMembers.map(member => (
                      <tr key={member.id}>
                        <td className="px-4 py-3">
                          <Input
                            value={member.code}
                            onChange={event =>
                              handleStaffChange(
                                member.id,
                                "code",
                                event.target.value
                              )
                            }
                            placeholder="e.g. S1"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={member.name}
                            onChange={event =>
                              handleStaffChange(
                                member.id,
                                "name",
                                event.target.value
                              )
                            }
                            placeholder="Staff name"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={50}
                            max={150}
                            step={5}
                            value={Math.round(member.capacity * 100)}
                            onChange={event =>
                              handleStaffCapacityChange(member.id, event.target.value)
                            }
                            aria-label={`${member.name || member.code} capacity in percent`}
                          />
                        </td>
                        {capabilities.map(capability => {
                          const isChecked = member.capabilityIds.includes(capability.id);
                          return (
                            <td key={capability.id} className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={isChecked}
                                onChange={() => toggleStaffCapability(member.id, capability.id)}
                                aria-label={`Assign ${capability.description || capability.code} to ${member.name}`}
                              />
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteStaffMember(member.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
