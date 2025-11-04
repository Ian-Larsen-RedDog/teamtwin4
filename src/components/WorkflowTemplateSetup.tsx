"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { Capability } from "@/components/TeamSetupScreen";

const TEMPLATE_DEFINITIONS = [
  { key: "enhancement", title: "Enhancement Template" },
  { key: "defect", title: "Defect Template" },
  { key: "incident", title: "Incident Template" },
] as const;

type TemplateKey = (typeof TEMPLATE_DEFINITIONS)[number]["key"];

type TemplateTask = {
  id: string;
  seqNumber: number;
  task: string;
  estimate: string;
  capabilityId: string;
};

interface WorkflowTemplateSetupProps {
  teamName: string;
  capabilities: Capability[];
  onBack?: () => void;
  onFinish?: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeSequence(tasks: TemplateTask[]): TemplateTask[] {
  return tasks
    .map((task, index) => ({
      ...task,
      seqNumber: (index + 1) * 10,
    }))
    .sort((a, b) => a.seqNumber - b.seqNumber);
}

export default function WorkflowTemplateSetup({
  teamName,
  capabilities,
  onBack,
  onFinish,
}: WorkflowTemplateSetupProps) {
  const [templates, setTemplates] = React.useState<Record<TemplateKey, TemplateTask[]>>({
    enhancement: [],
    defect: [],
    incident: [],
  });

  const hasCapabilities = capabilities.length > 0;

  const handleAddTask = (templateKey: TemplateKey) => {
    setTemplates(prev => {
      const current = prev[templateKey] ?? [];
      const nextCapabilityId = current.length
        ? current[current.length - 1].capabilityId
        : capabilities[0]?.id ?? "";

      const newTask: TemplateTask = {
        id: generateId(),
        seqNumber: (current.length + 1) * 10,
        task: "",
        estimate: "",
        capabilityId: nextCapabilityId,
      };

      return {
        ...prev,
        [templateKey]: [...current, newTask],
      };
    });
  };

  const handleTaskChange = <K extends keyof Pick<TemplateTask, "task" | "estimate" | "capabilityId">>(
    templateKey: TemplateKey,
    taskId: string,
    key: K,
    value: TemplateTask[K]
  ) => {
    setTemplates(prev => {
      const current = prev[templateKey] ?? [];
      const updated = current.map(task =>
        task.id === taskId
          ? {
              ...task,
              [key]: value,
            }
          : task
      );
      return {
        ...prev,
        [templateKey]: normalizeSequence(updated),
      };
    });
  };

  const handleMoveTask = (templateKey: TemplateKey, taskId: string, direction: "up" | "down") => {
    setTemplates(prev => {
      const current = prev[templateKey] ?? [];
      const list = [...current];
      const index = list.findIndex(task => task.id === taskId);
      if (index === -1) {
        return prev;
      }

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= list.length) {
        return prev;
      }

      const temp = list[index];
      list[index] = list[swapIndex];
      list[swapIndex] = temp;

      return {
        ...prev,
        [templateKey]: normalizeSequence(list),
      };
    });
  };

  const handleDeleteTask = (templateKey: TemplateKey, taskId: string) => {
    setTemplates(prev => {
      const current = prev[templateKey] ?? [];
      const filtered = current.filter(task => task.id !== taskId);
      return {
        ...prev,
        [templateKey]: normalizeSequence(filtered),
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Workflow Template Setup for <span className="text-primary">{teamName}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure standard tasks for each workflow template used by your team.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {onBack ? (
            <Button type="button" variant="outline" onClick={onBack}>
              Back to Team Setup
            </Button>
          ) : null}
          {onFinish ? (
            <Button type="button" onClick={onFinish}>
              Finish
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {TEMPLATE_DEFINITIONS.map(template => {
            const tasks = templates[template.key];
            return (
              <Card key={template.key} className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <Button type="button" size="sm" onClick={() => handleAddTask(template.key)}>
                    Add Task
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Seq #</th>
                          <th className="px-3 py-2 text-left">Task</th>
                          <th className="px-3 py-2 text-left">Estimate (hh:mm)</th>
                          <th className="px-3 py-2 text-left">Capability</th>
                          <th className="px-3 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {tasks.length === 0 ? (
                          <tr>
                            <td className="px-3 py-6 text-center text-xs text-gray-500" colSpan={5}>
                              No tasks defined. Click &ldquo;Add Task&rdquo; to create one.
                            </td>
                          </tr>
                        ) : (
                          tasks.map((task, index) => (
                            <tr key={task.id}>
                              <td className="whitespace-nowrap px-3 py-2 align-top font-semibold text-gray-700">
                                {task.seqNumber}
                              </td>
                              <td className="px-3 py-2 align-top">
                                <Input
                                  value={task.task}
                                  onChange={event =>
                                    handleTaskChange(template.key, task.id, "task", event.target.value)
                                  }
                                  placeholder="Describe the task"
                                />
                              </td>
                              <td className="px-3 py-2 align-top">
                                <Input
                                  value={task.estimate}
                                  onChange={event =>
                                    handleTaskChange(template.key, task.id, "estimate", event.target.value)
                                  }
                                  placeholder="e.g. 01:30"
                                  aria-label="Estimated effort in hours and minutes"
                                />
                              </td>
                              <td className="px-3 py-2 align-top">
                                <select
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  value={task.capabilityId}
                                  onChange={event =>
                                    handleTaskChange(template.key, task.id, "capabilityId", event.target.value)
                                  }
                                  disabled={!hasCapabilities}
                                >
                                  <option value="" disabled>
                                    Select capability
                                  </option>
                                  {capabilities.map(capability => (
                                    <option key={capability.id} value={capability.id}>
                                      {capability.description || capability.code || "Capability"}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2 align-top text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleMoveTask(template.key, task.id, "up")}
                                    disabled={index === 0}
                                    aria-label="Move task up"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleMoveTask(template.key, task.id, "down")}
                                    disabled={index === tasks.length - 1}
                                    aria-label="Move task down"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDeleteTask(template.key, task.id)}
                                    aria-label="Delete task"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!hasCapabilities ? (
                    <p className="text-xs text-amber-600">
                      Define at least one capability in the team setup to assign it here.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
