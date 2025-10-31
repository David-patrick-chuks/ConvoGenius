import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateAvatarUri } from "@/lib/avatar";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import  Highlighter  from "react-highlight-words";

interface Props {
  meetingId: string;
}

export const Transcript = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const {data} = useQuery(trpc.meetings.getTranscript.queryOptions({ id: meetingId }))

  const [searchQuery, setSearchQuery] = useState("");
  const filteredData = (data ?? []).filter((item) =>
    item.text.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-5 gap-y-4 w-full">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Transcript</p>
      <div className="relative">
        <Input
          placeholder="Search transcript"
          className="pl-7 h-9 w-[240px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-500 dark:text-gray-400" />
      </div>
      <ScrollArea>
        <div className="flex flex-col gap-y-4">
          {filteredData.map((item) => {
            return(
              <div key={item.start_ts} className="flex flex-col gap-x-2">
                <div className="flex gap-x-2 items-center">
                  <Avatar className="size-6 border border-gray-300 dark:border-gray-600">
                    <AvatarImage
                      src = {item.user.image ?? generateAvatarUri({seed: item.user.name, variant: "initials"})}
                      alt={item.user.name}
                    />
                  </Avatar>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.user.name}</p>
                  <p className="text-sm text-blue-500 dark:text-blue-400 font-medium">
                    {format(new Date(0,0,0,0,0,0 , item.start_ts), "mm:ss")}
                  </p>
                </div>
                <Highlighter
                  className="text-sm text-gray-700 dark:text-gray-300"
                  highlightClassName="bg-yellow-200 dark:bg-yellow-600 dark:text-gray-900"
                  searchWords={[searchQuery]}
                  textToHighlight={item.text}
                />
              </div>
            )
          } )}
        </div>
      </ScrollArea>
    </div>
  )

}