import {
  Search,
  ListChecks,
  GitCompare,
  LayoutDashboard,
  BadgeDollarSign,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Link } from 'react-router'
import { ROUTES } from '@/lib/constants'

const menuItems = [
  {
    title: 'Search',
    icon: Search,
    url: ROUTES.SEARCH,
  },
  {
    title: 'Bookmarks',
    icon: ListChecks,
    url: ROUTES.BOOKMARKS,
  },
  {
    title: 'Compare',
    icon: GitCompare,
    url: ROUTES.COMPARE,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BadgeDollarSign className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Himura</span>
            <span className="text-xs text-muted-foreground">
              Stock Market Explorer
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className="flex items-center gap-3"
                      prefetch="render"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
