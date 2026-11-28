import { ja } from '@/shared/i18n/ja'

// Outline tag of a required mission (Figma: "必須" on MissionItem and on the S12 header).
export function RequiredTag() {
  return (
    <span className="shrink-0 rounded-md border border-festival px-[5px] py-px text-xs leading-normal font-bold text-festival">
      {ja.mission.required}
    </span>
  )
}
