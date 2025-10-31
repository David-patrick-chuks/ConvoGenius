"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { authClient } from "@/lib/auth-client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

import { PricingCard } from "../components/pricing-card";

export const UpgradeView = () =>{

  const trpc = useTRPC();
  const { data: products } = useSuspenseQuery(
    trpc.premium.getProducts.queryOptions()
  );
  const {data : currentSubscription} = useSuspenseQuery(
    trpc.premium.getCurrentSubscription.queryOptions()
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
            <Sparkles className="size-4" />
            Upgrade to Premium
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Choose Your Perfect Plan
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            You are currently on the{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {currentSubscription?.name ?? "Free"}
            </span>{" "}
            plan. Unlock the full potential of ConvoGenius with advanced AI features.
          </p>
        </div>

        <div className="grid gap-8 md:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {products.map((product) => {
           const isCurrentProduct = currentSubscription?.id === product.id;
           const isPremium = !!currentSubscription;
           
           let buttonText = "Upgrade Now";
           let onClick = () => authClient.checkout({products: [product.id]});

           if (isCurrentProduct) {
            buttonText = "Manage Plan";
            onClick = () => authClient.customer.portal();
           }else if(isPremium){
            buttonText = "Change Plan";
            onClick = () => authClient.customer.portal();
           }
            return (
              <PricingCard
                key={product.id}
                buttonText={buttonText}
                onClick={onClick}
                variant={
                  product.metadata.variant === "highlighted"
                    ? "highlighted"
                    : "default"
                }
                title={product.name}
                price={
                  product.prices[0].amountType === "fixed"
                    ? product.prices[0].priceAmount /100 
                    : 0 
                }
                description={product.description}
                priceSuffix={`/${product.prices[0].recurringInterval}`}
                features = {product.benefits.map(
                  (benefit) => benefit.description
                )}
                isCurrentPlan={isCurrentProduct}
              />
            )
          })}
        </div>

        
      </div>
    </div>
  );
}

export const UpgradeViewLoading = () => {
  return (
    <LoadingState title = "Loading..." description="Please wait while we load the upgrade options." />
  );
}

export const UpgradeViewError = () => {
  return (
    <ErrorState title = "Error" description="There was an error loading the upgrade options. Please try again later." />
  );
}