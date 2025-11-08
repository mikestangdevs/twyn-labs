"use client"

import { useRouter } from "next/navigation"
import { Loader2, MoreHorizontal, Star, Pencil, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from 'react'
import React from 'react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarInput,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Simulation } from '@/types/simulationApiTypes'
import { DatabaseService } from "@/services/databaseService"

interface GroupedSimulations {
  starred: Simulation[];
  today: Simulation[];
  yesterday: Simulation[];
  last7Days: Simulation[];
  last30Days: Simulation[];
}

interface NavMainProps {
  simulations: Simulation[];
  loading: boolean;
  error: string | null;
}

export function NavMain({ simulations: initialSimulations, loading, error }: NavMainProps) {
  const router = useRouter();
  const [simulations, setSimulations] = useState(initialSimulations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Update simulations when props change
  React.useEffect(() => {
    setSimulations(initialSimulations);
  }, [initialSimulations]);

  const categorizeSimulations = (simulations: Simulation[]): GroupedSimulations => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    return simulations.reduce<GroupedSimulations>(
      (groups, simulation) => {
        // First check if it's starred
        if (simulation.is_starred) {
          groups.starred.push(simulation);
          return groups;
        }

        const simDate = new Date(simulation.created_at);
        
        if (simDate >= today) {
          groups.today.push(simulation);
        } else if (simDate >= yesterday) {
          groups.yesterday.push(simulation);
        } else if (simDate >= last7Days) {
          groups.last7Days.push(simulation);
        } else if (simDate >= last30Days) {
          groups.last30Days.push(simulation);
        }
        
        return groups;
      },
      { starred: [], today: [], yesterday: [], last7Days: [], last30Days: [] }
    );
  };

  const shouldShowLoader = (status: string) => {
    return ['pending', 'processing_config', 'completed_config', 'processing_simulation', 'completed_simulation', 'processing_report'].includes(status);
  };

  const handleStarToggle = async (simulation: Simulation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistically update the UI
    const newStarredState = !simulation.is_starred;
    setSimulations(prevSimulations => 
      prevSimulations.map(sim => 
        sim.id === simulation.id 
          ? { ...sim, is_starred: newStarredState }
          : sim
      )
    );

    try {
      await DatabaseService.toggleSimulationStar(simulation.id, newStarredState);
    } catch (error) {
      console.error('Failed to toggle star status:', error);
      // Revert the optimistic update on error
      setSimulations(prevSimulations => 
        prevSimulations.map(sim => 
          sim.id === simulation.id 
            ? { ...sim, is_starred: !newStarredState }
            : sim
        )
      );
    }
  };

  const handleDelete = async (simulation: Simulation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistically remove from UI
    setSimulations(prevSimulations => 
      prevSimulations.filter(sim => sim.id !== simulation.id)
    );

    try {
      await DatabaseService.deleteSimulation(simulation.id);
      router.push('/sim');
    } catch (error) {
      console.error('Failed to delete simulation:', error);
      // Revert the optimistic update on error
      setSimulations(prevSimulations => [...prevSimulations, simulation]);
    }
  };

  const handleRename = async (simulation: Simulation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(simulation.id);
    setEditingTitle(simulation.title || "");
  };

  const handleRenameSubmit = async (simulation: Simulation) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    // Optimistically update the UI
    setSimulations(prevSimulations =>
      prevSimulations.map(sim =>
        sim.id === simulation.id
          ? { ...sim, title: editingTitle.trim() }
          : sim
      )
    );
    setEditingId(null);

    try {
      await DatabaseService.updateSimulationTitle(simulation.id, editingTitle.trim());
    } catch (error) {
      console.error('Failed to rename simulation:', error);
      // Revert the optimistic update on error
      setSimulations(prevSimulations =>
        prevSimulations.map(sim =>
          sim.id === simulation.id
            ? { ...sim, title: simulation.title }
            : sim
        )
      );
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, simulation: Simulation) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit(simulation);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingId(null);
    }
  };

  const handleRenameBlur = (simulation: Simulation) => {
    handleRenameSubmit(simulation);
  };

  const renderSimulationGroup = (title: string, simulations: Simulation[]) => {
    if (simulations.length === 0) return null;

    return (
      <SidebarGroup key={title} className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground">
          {title === "Starred" && <Star className="!h-3 !w-3 mr-1" />}
          {title}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {simulations.map((simulation) => (
              <SidebarMenuItem key={simulation.id}>
                {editingId === simulation.id ? (
                  <SidebarInput
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, simulation)}
                    onBlur={() => handleRenameBlur(simulation)}
                    className="w-full bg-accent px-2 pr-7 border-0 focus-visible:ring-0 shadow-none text-sm h-8 hover:bg-accent hover:text-accent-foreground"
                  />
                ) : (
                  <SidebarMenuButton
                    onClick={() => router.push(`/sim/${simulation.id}`)}
                    className="w-full justify-between cursor-pointer"
                  >
                    <span className="text-left text-sm truncate">
                      {simulation.title || 'Untitled Simulation'}
                    </span>
                    {shouldShowLoader(simulation.status) && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                    )}
                  </SidebarMenuButton>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      className="data-[state=open]:bg-accent rounded-sm"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-24 rounded-lg"
                    side="right"
                    align="start"
                  >
                    <DropdownMenuItem 
                      className="flex items-center gap-2 px-2 py-1.5 text-sm"
                      onClick={(e) => handleStarToggle(simulation, e)}
                    >
                      <Star className={cn("h-4 w-4", simulation.is_starred && "fill-current")} />
                      <span>{simulation.is_starred ? 'Unstar' : 'Star'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 px-2 py-1.5 text-sm"
                      onClick={(e) => handleRename(simulation, e)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      variant="destructive"
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-destructive"
                      onClick={(e) => handleDelete(simulation, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  const groupedSimulations = categorizeSimulations(simulations);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2 mt-2">
          <SidebarMenu>
            <SidebarMenuButton
              tooltip="New sim"
              className="cursor-pointer bg-primary/80 rounded-full text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              onClick={() => router.push(`/sim`)}
            >
              <Plus className="h-6 w-6" />
              <span className="group-data-[collapsible=icon]:hidden font-bold">New sim</span>
            </SidebarMenuButton>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {!loading && !error && simulations.length > 0 && (
        <>
          {renderSimulationGroup("Starred", groupedSimulations.starred)}
          {renderSimulationGroup("Today", groupedSimulations.today)}
          {renderSimulationGroup("Yesterday", groupedSimulations.yesterday)}
          {renderSimulationGroup("Last 7 Days", groupedSimulations.last7Days)}
          {renderSimulationGroup("Last 30 Days", groupedSimulations.last30Days)}
        </>
      )}
    </>
  );
}
