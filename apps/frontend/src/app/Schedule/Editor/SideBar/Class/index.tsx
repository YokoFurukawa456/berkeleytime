import { useMemo, useState } from "react";

import { EditPencil, Eye, EyeClosed, Trash } from "iconoir-react";

import { acceptedColors } from "@/app/Schedule/schedule";
import { ActionMenu } from "@/components/ActionMenu";
import { MenuItem } from "@/components/BubbleCard";
import ClassCard from "@/components/ClassCard";
import ClassDrawer from "@/components/ClassDrawer";
import { ColorDot } from "@/components/ColorDot";
import { IScheduleClass, componentMap } from "@/lib/api";
import { capitalizeColor } from "@/lib/colors";
import { Color, Component, Semester } from "@/lib/generated/graphql";

import styles from "./Class.module.scss";
import Section from "./Section";

interface ClassProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  editing: boolean;
  class: IScheduleClass["class"];
  semester: Semester;
  year: number;
  sessionId: string;
  color: Color;
  hidden?: boolean;
  locked?: boolean;
  lockedComponents?: Component[];
  selectedSections: IScheduleClass["selectedSections"];
  onSectionSelect: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    number: string
  ) => void;
  onSectionMouseOver: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    number: string
  ) => void;
  onSectionMouseOut: () => void;
  onDelete: (cls: IScheduleClass["class"]) => void;
  onColorChange: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    color: Color
  ) => void;
  onLockChange: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    locked: boolean
  ) => void;
  onHideChange: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    hidden: boolean
  ) => void;
  onComponentLockChange: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    component: Component,
    locked: boolean
  ) => void;
}

export default function Class({
  expanded,
  onExpandedChange,
  editing,
  class: _class,
  semester,
  year,
  sessionId,
  color,
  hidden = false,
  selectedSections,
  onSectionSelect,
  onSectionMouseOver,
  onSectionMouseOut,
  onDelete,
  onColorChange,
  onHideChange,
}: ClassProps) {
  const groups = useMemo(() => {
    const sortedSections = _class.sections.toSorted((a, b) =>
      a.number.localeCompare(b.number)
    );

    return Object.groupBy(sortedSections, (section) => section.component);
  }, [_class]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Color submenu
  const colorSubItems: MenuItem[] = acceptedColors.map((c) => ({
    name: capitalizeColor(c),
    icon: <ColorDot color={c} />,
    onClick: () =>
      onColorChange(_class.subject, _class.courseNumber, _class.number, c),
  }));

  const menuItems: MenuItem[] = [
    {
      name: "Edit color",
      icon: <EditPencil width={18} height={18} />,
      subItems: colorSubItems,
    },
    {
      name: hidden ? "Show class" : "Hide class",
      icon: hidden ? (
        <Eye width={18} height={18} />
      ) : (
        <EyeClosed width={18} height={18} />
      ),
      onClick: () =>
        onHideChange(
          _class.subject,
          _class.courseNumber,
          _class.number,
          !hidden
        ),
    },
    {
      name: "Delete class",
      icon: <Trash width={18} height={18} />,
      onClick: () => onDelete(_class),
      isDelete: true,
    },
  ];

  return (
    <ClassDrawer
      subject={_class.subject}
      number={_class.number}
      courseNumber={_class.courseNumber}
      year={year}
      semester={semester}
      sessionId={sessionId}
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
    >
      <div
        onClick={(e) => {
          // Only open drawer if not clicking on action areas
          // Action buttons have stopPropagation, so they won't trigger this
          const target = e.target as HTMLElement;
          if (
            target.closest("[data-action-icon]") ||
            target.closest("[data-actions]") ||
            target.closest("[data-color-selector]") ||
            target.closest("[data-action-menu]")
          ) {
            return;
          }
          setDrawerOpen(true);
        }}
        style={{ cursor: "pointer" }}
      >
        <ClassCard
          data-draggable
          class={_class}
          expandable
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          leftBorderColor={hidden ? undefined : color}
          customActionMenu={
            editing ? <ActionMenu menuItems={menuItems} asIcon /> : undefined
          }
          wrapDescription={true}
        >
          <div className={styles.group}>
            <div className={styles.label}>
              {_class.primarySection ? (
                (() => {
                  const primaryComponent = _class.primarySection.component;
                  return (
                    <>
                      <p className={styles.component}>
                        {componentMap[primaryComponent]}
                      </p>
                      <p className={styles.time}>Time</p>
                    </>
                  );
                })()
              ) : (
                <>
                  <p className={styles.component}>N/A</p>
                  <p className={styles.time}>Time</p>
                </>
              )}
            </div>
            {_class.primarySection && (
              <Section
                active={selectedSections.some(
                  (selectedSection) =>
                    selectedSection.sectionId ===
                    _class.primarySection?.sectionId
                )}
                editing={editing}
                {..._class.primarySection}
                onSectionMouseOver={() =>
                  onSectionMouseOver(
                    _class.subject,
                    _class.courseNumber,
                    _class.number,
                    _class.primarySection?.number
                  )
                }
                onSectionMouseOut={onSectionMouseOut}
                onSectionSelect={() =>
                  onSectionSelect(
                    _class.subject,
                    _class.courseNumber,
                    _class.number,
                    _class.primarySection?.number
                  )
                }
              />
            )}
          </div>
          {Object.keys(groups).map((component) => {
            const group = component as Component;

            return (
              <div className={styles.group} key={component}>
                <div className={styles.label}>
                  <p className={styles.component}>{componentMap[group]}</p>
                  <p className={styles.time}>Time</p>
                </div>
                {groups[group]?.map((section) => {
                  const active = selectedSections.some(
                    (selectedSection) =>
                      selectedSection.sectionId === section.sectionId
                  );

                  return (
                    <Section
                      active={active}
                      editing={editing}
                      onSectionMouseOut={onSectionMouseOut}
                      onSectionMouseOver={() =>
                        onSectionMouseOver(
                          _class.subject,
                          _class.courseNumber,
                          _class.number,
                          section.number
                        )
                      }
                      onSectionSelect={() =>
                        onSectionSelect(
                          _class.subject,
                          _class.courseNumber,
                          _class.number,
                          section.number
                        )
                      }
                      {...section}
                      key={section.sectionId}
                    />
                  );
                })}
              </div>
            );
          })}
        </ClassCard>
      </div>
    </ClassDrawer>
  );
}
