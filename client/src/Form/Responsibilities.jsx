import React from "react";

export default function Responsibilities({ formData, handleChange }) {
  const skillOptions = [
    "painting",
    "able to lift 50 lb",
    "able to stand for long periods",
    "able to walk long distances",
    "mobility",
    "welding",
    "machining",
    "pipefitting",
    "sewing machine operator",
    "pattern maker",
  ];

  const handleSkillToggle = (skill) => {
    const current = formData.associatedSkills?.split(",").filter(Boolean) || [];
    const exists = current.includes(skill);
    const updated = exists
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    handleChange({
      target: {
        name: "associatedSkills",
        value: updated.join(","),
      },
    });
  };


  return (
    <div className="space-y-6">

      {/* Responsibilities */}
      <div>
        <label className="block text-lg font-medium mb-2">Responsibilities</label>
        <textarea
          name="responsiblities"
          value={formData.responsiblities || ""}
          onChange={handleChange}
          className="w-full border p-3 rounded min-h-[100px]"
          placeholder={`• Follow safety protocols\n• Maintain workspace\n• Collaborate with team members`}
        />
      </div>

      {/* Qualifications and Skills */}
      <div>
        <label className="block text-lg font-medium mb-2">Qualification and Skills</label>
        <textarea
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          className="w-full border p-3 rounded min-h-[100px]"
          placeholder="List required qualifications and skills..."
        />
      </div>

      {/* Skills Buttons */}
      <div>
        <label className="block text-lg font-medium mb-2">
          Skills often associated with this job
        </label>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map((skill) => {
            const selected =
              formData.associatedSkills?.split(",").includes(skill) || false;
            return (
              <button
                key={skill}
                type="button"
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-2 rounded-full text-sm font-medium border transition ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Company Description */}
      <div>
        <label className="block text-lg font-medium mb-2">
          Company Description (Describe your Company)
        </label>
        <textarea
          name="companyDescription"
          value={formData.companyDescription}
          onChange={handleChange}
          className="w-full border p-3 rounded min-h-[100px]"
          placeholder="Tell candidates about your company culture, mission, or values..."
        />
      </div>
    </div>
  );
}
