import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

import { useAgentFilters } from "../../hooks/use-agent-filters";    

export const AgentsSearchFilter = () => {
    const [filters, setFilters] = useAgentFilters();

    return (
        <div className="relative">
            <Input
                placeholder="Filter by Name "
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="h-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 w-[200px] pl-7"
            />
            <SearchIcon className="size-4 text-gray-500 dark:text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
        </div>
    );
};