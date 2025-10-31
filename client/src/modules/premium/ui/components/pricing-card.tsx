import { CircleCheckIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"


const pricingCardVariants = cva(
  "relative flex flex-col p-8 rounded-xl border-2 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-lg",
        highlighted: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-gray-900 dark:text-white border-blue-300 dark:border-blue-600 shadow-xl scale-105 hover:scale-110 hover:shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
const pricingCardIconVariants = cva(
  "size-5 flex-shrink-0 mt-0.5",
  {
    variants: {
      variant: {
        default: "text-green-600 dark:text-green-400",
        highlighted: "text-blue-600 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
const pricingCardSecondaryTextVariants = cva("", {
    variants: {
    variant: {
      default: "text-gray-600 dark:text-gray-400",
      highlighted: "text-gray-700 dark:text-gray-300",
    },
  },
})
const pricingCardBadgeVariants = cva("text-xs font-medium px-3 py-1 rounded-full", {
    variants: {
    variant: {
      default: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
      highlighted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
    },
  },
    defaultVariants: {
    variant: "default",
    },
    });

interface Props extends VariantProps<typeof pricingCardVariants> {
  badge?: string | null;
  price: number;
  features: string[];
  title: string;
  description?: string | null;
  priceSuffix: string;
  className?: string;
  buttonText: string;
  onClick: () => void;
  isCurrentPlan?: boolean;
}

export const PricingCard = ({
  variant,
  badge,
  price,
  features,
  title,
  description,
  priceSuffix,
  className,
  buttonText,
  onClick,
  isCurrentPlan,
}: Props)=>{
  return (
    <div className={cn(pricingCardVariants({ variant }), className)}>
      {variant === "highlighted" && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-yellow-400 text-yellow-900 font-medium px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      <div className="flex-1">
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <h3 className="font-bold text-xl">{title}</h3>
              {badge && (
                <Badge className={cn(pricingCardBadgeVariants({ variant }))}>
                  {badge}
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full">
                  Current Plan
                </Badge>
              )}
            </div>
          </div>
          
          <p className={cn(
            "text-sm leading-relaxed",
            pricingCardSecondaryTextVariants({ variant }),
          )}>
            {description}
          </p>
          
          <div className="flex items-baseline gap-x-1">
            <h2 className="text-4xl font-bold">
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              }).format(price)}
            </h2>
            <span className={cn(
              "text-sm font-medium",
              pricingCardSecondaryTextVariants({ variant })
            )}>
              {priceSuffix}
            </span>
          </div>
        </div>
        
        <div className="my-6">
          <Separator className={cn(
            variant === "highlighted" 
              ? "bg-blue-400 opacity-30" 
              : "bg-gray-200 dark:bg-gray-700"
          )} />
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wide">
            What&apos;s included
          </h4>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-x-3">
                <CircleCheckIcon className={cn(pricingCardIconVariants({ variant }))} />
                <span className={cn(
                  "text-sm leading-relaxed",
                  pricingCardSecondaryTextVariants({ variant })
                )}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-8">
        <Button
          className={cn(
            "w-full font-medium",
            variant === "highlighted" 
              ? "bg-white text-blue-600 hover:bg-gray-100" 
              : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          )}
          size="lg"
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  )
}
