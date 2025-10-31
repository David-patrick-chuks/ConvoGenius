"use client";
import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { OctagonAlert } from "lucide-react";

import {FaGoogle, FaGithub} from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {Alert, AlertTitle} from "@/components/ui/alert";
import{
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";


const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password is required"),
});


export const SignInView = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error,setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit =  (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);
    authClient.signIn.email(
      {
      email: data.email,
      password: data.password,
      callbackURL: "/dashboard",
      },
      {
        onSuccess: () => {
          setPending(false);
          router.push("/dashboard");
        },
        onError: ({error}) => {
          setError(error.message);
        }
      }
    )
  };

  const onSocial =  (provider: "github" | "google") => {
    setError(null);
    setPending(true);
    authClient.signIn.social(
      {
        provider: provider,
        callbackURL: "/dashboard",
      },
      {
        onSuccess: () => {
          
          setPending(false);
        },
        onError: ({error}) => {
          setError(error.message);
        }
      }
    )
  };
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form{...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col item-center text-center">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Welcome to ConvoGenius
                  </h1>
                  <p className="text-muted-foreground dark:text-gray-400 text-balance">
                    Login to your account
                  </p>
                </div>
                <div className="grid gap-3">
                  <FormField 
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="something@gmail.com" {...field} className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField 
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                </div>

                {!!error && (
                  <Alert className="bg-destructive/10 border-none">
                    <OctagonAlert className="h-4 w-4 !text-destructive" />
                    <AlertTitle className="text-destructive">
                     {error}
                      </AlertTitle>
                  </Alert>
                )}
                <Button className="w-full" type="submit" disabled={pending}>
                  Sign In
                </Button>
                <div className="after:border-border dark:after:border-gray-600 relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card dark:bg-gray-800 text-muted-foreground dark:text-gray-400 relative z-10 px-2">
                    Or continue with
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button disabled={pending} type="button" variant="outline" className="w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => onSocial("google")
                  }>
                    <FaGoogle/>
                  </Button>
                  <Button disabled={pending} type="button" variant="outline" className="w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => {
                    authClient.signIn.social({
                      provider: "github",
                    })
                  }}>
                    <FaGithub/>
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground dark:text-gray-400">
                  Don&apos;t have an account? {" "}
                  <Link href={"/sign-up"} className="text-primary dark:text-blue-400 underline underline-offset-4">
                   Sign-Up
                  </Link>
                </div>
              </div>
            </form>
          </Form>


          <div className="bg-radial from-sidebar-accent to-sidebar dark:from-gray-700 dark:to-gray-900 relative hidden md:flex flex-col gap-y-4 items-center justify-center">
            <Image src="/logo.svg" alt="ConvoGenius Logo" className="w-[92px] h-[92px]" width={92} height={92} />
            <p className="text-2xl text-white dark:text-gray-200 font-semibold">ConvoGenius</p>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
